import { ActionError, defineAction } from "astro:actions";
import { z } from "astro:schema";
import { sql } from "bun";
import { PaginationSchema } from "../util";
import type { Transaction } from "./types";
import { verifyTokenForUser } from "../auth/totp";

// ==========================
// Shop Transaction Actions
// ==========================

export const shopTransactionActions = {
  /**
   * Purchase single item - deducts from balance and stock
   * @returns Success status, new balance and remaining stock
   */
  purchase: defineAction({
    input: z.object({
      itemId: z.string().uuid(),
      quantity: z.number().int().min(1).max(100),
      totp: z
        .object({
          userId: z.string(),
          token: z.string(),
        })
        .optional(),
    }),
    handler: async ({ itemId, quantity, totp }, { locals: { auth } }) => {
      let userId = undefined;
      if (totp && (await verifyTokenForUser(totp.userId, totp.token))) {
        userId = totp.userId;
      } else if (auth) {
        userId = auth.userId;
      }

      if (!userId) throw new ActionError({ code: "UNAUTHORIZED" });

      const [result] = await sql`
        WITH purchase AS (
          INSERT INTO shop.transactions (shop_id, user_id, item_id, amount_cents, item_amount, type)
          SELECT i.shop_id, ${userId}, i.id, i.price_cents * ${quantity}, ${-quantity}, 'purchase'
          FROM shop.items i
          JOIN shop.items_with_stock s ON s.id = i.id
          JOIN auth.policies p ON p.scope = 'shop:' || i.shop_id AND p.user_id = ${userId} AND p.level >= 'use'::auth.permission
          WHERE i.id = ${itemId}::uuid AND i.active = true
            AND s.stock >= ${quantity}
            AND (SELECT COALESCE(balance_cents, 0) FROM shop.user_balances b
                 WHERE b.shop_id = i.shop_id AND b.user_id = ${userId}) >= (i.price_cents * ${quantity})
          RETURNING shop_id, amount_cents
        )
        SELECT p.amount_cents AS "purchaseCents",
               COALESCE(b.balance_cents, 0) - p.amount_cents AS "newBalance",
               COALESCE(s.stock, 0) - ${quantity} AS "remainingStock"
        FROM purchase p
        LEFT JOIN shop.user_balances b ON b.shop_id = p.shop_id AND b.user_id = ${userId}
        LEFT JOIN shop.items_with_stock s ON s.id = ${itemId}::uuid
      `;

      if (!result) {
        throw new ActionError({
          code: "BAD_REQUEST",
          message: "Purchase failed. Check balance, stock or permissions.",
        });
      }

      return {
        success: true,
        newBalance: result.newBalance as number,
        remainingStock: result.remainingStock as number,
      };
    },
  }),

  /**
   * Restock item - adds to stock (manage permission required)
   * @returns Success status and new stock level
   */
  restock: defineAction({
    input: z.object({
      itemId: z.string().uuid(),
      quantity: z.number().int().min(1).max(1000),
      creditUser: z.boolean().default(false),
    }),
    handler: async ({ itemId, quantity, creditUser }, { locals: { auth } }) => {
      if (!auth) throw new ActionError({ code: "UNAUTHORIZED" });

      const [result] = await sql`
        WITH restock AS (
          INSERT INTO shop.transactions (shop_id, user_id, item_id, amount_cents, item_amount, type)
          SELECT i.shop_id, ${auth.userId}, i.id,
                 CASE WHEN ${creditUser} THEN -(i.price_cents * ${quantity}) ELSE 0 END,
                 ${quantity}, 'restock'
          FROM shop.items i
          WHERE i.id = ${itemId}::uuid
            AND EXISTS (SELECT 1 FROM auth.policies p
                        WHERE p.scope = 'shop:' || i.shop_id AND p.user_id = ${auth.userId} AND p.level >= 'manage'::auth.permission)
          RETURNING item_id
        )
        SELECT COALESCE(s.stock, 0) + ${quantity} AS "newStock"
        FROM restock r
        JOIN shop.items_with_stock s ON s.id = r.item_id
      `;

      if (!result) {
        throw new ActionError({
          code: "FORBIDDEN",
          message: "No manage permission or item not found.",
        });
      }

      return {
        success: true,
        newStock: result.newStock,
      };
    },
  }),

  /**
   * Record loss - removes from stock without payment (manage permission required)
   * @returns Success status and new stock level
   */
  loss: defineAction({
    input: z.object({
      itemId: z.string().uuid(),
      quantity: z.number().int().min(1).max(1000),
    }),
    handler: async ({ itemId, quantity }, { locals: { auth } }) => {
      if (!auth) throw new ActionError({ code: "UNAUTHORIZED" });

      const [result] = await sql`
        WITH loss AS (
          INSERT INTO shop.transactions (shop_id, user_id, item_id, amount_cents, item_amount, type)
          SELECT i.shop_id, ${auth.userId}, i.id, 0, ${-quantity}, 'loss'
          FROM shop.items i
          JOIN shop.items_with_stock s ON s.id = i.id
          WHERE i.id = ${itemId}::uuid
            AND s.stock >= ${quantity}
            AND EXISTS (SELECT 1 FROM auth.policies p
                        WHERE p.scope = 'shop:' || i.shop_id AND p.user_id = ${auth.userId} AND p.level >= 'manage'::auth.permission)
          RETURNING item_id
        )
        SELECT COALESCE(s.stock, 0) - ${quantity} AS "newStock"
        FROM loss l
        JOIN shop.items_with_stock s ON s.id = l.item_id
      `;

      if (!result) {
        throw new ActionError({
          code: "FORBIDDEN",
          message:
            "No manage permission, item not found or insufficient stock.",
        });
      }

      return {
        success: true,
        newStock: result.newStock as number,
      };
    },
  }),

  /**
   * Topup user balance - adds credit to user account (manage permission required)
   * @returns Success status and user's new balance
   */
  topup: defineAction({
    input: z.object({
      shopId: z.string().uuid(),
      targetUserId: z.string(),
      amountCents: z.number().int().min(1).max(100000),
    }),
    handler: async (
      { shopId, targetUserId, amountCents },
      { locals: { auth } },
    ) => {
      if (!auth) throw new ActionError({ code: "UNAUTHORIZED" });

      const [result] = await sql`
        WITH topup AS (
          INSERT INTO shop.transactions (shop_id, user_id, item_id, amount_cents, item_amount, type)
          SELECT ${shopId}, ${targetUserId}, NULL, ${-amountCents}, 0, 'topup'
          FROM auth.users u
          WHERE u.id = ${targetUserId}
            AND EXISTS (SELECT 1 FROM auth.policies p
                        WHERE p.scope = 'shop:' || ${shopId}::uuid AND p.user_id = ${auth.userId} AND p.level >= 'manage'::auth.permission)
          RETURNING shop_id, user_id
        )
        SELECT COALESCE(b.balance_cents, 0) + ${amountCents} AS "newBalance"
        FROM topup t
        LEFT JOIN shop.user_balances b ON b.shop_id = t.shop_id AND b.user_id = t.user_id
      `;

      if (!result) {
        throw new ActionError({
          code: "FORBIDDEN",
          message: "No manage permission or user not found.",
        });
      }

      return {
        success: true,
        newBalance: result.newBalance as number,
      };
    },
  }),

  /**
   * List transactions for a shop with pagination
   * @returns Paginated list of transactions
   */
  list: defineAction({
    input: z
      .object({
        shopId: z.string().uuid(),
      })
      .and(PaginationSchema),
    handler: async (
      { shopId, perPage, page, offset },
      { locals: { auth } },
    ) => {
      if (!auth) throw new ActionError({ code: "UNAUTHORIZED" });

      // Check user's permission level
      const [policy] = await sql`
        SELECT level FROM auth.policies
        WHERE scope = 'shop:' || ${shopId} AND user_id = ${auth.userId}
      `;

      if (!policy) {
        throw new ActionError({
          code: "FORBIDDEN",
          message: "No permission for this shop.",
        });
      }

      const isManager = policy.level === "manage";

      const data = await sql`
        SELECT t.id, t.shop_id AS "shopId", t.user_id AS "userId", t.item_id AS "itemId",
               i.name AS "itemName", t.amount_cents AS "amountCents", t.item_amount AS "itemAmount",
               t.type, t.description, t.created_at AS "createdAt",
               COALESCE(u.username, '(deleted user)') AS "username"
        FROM shop.transactions t
        JOIN auth.policies p ON p.scope = 'shop:' || t.shop_id AND p.user_id = ${auth.userId} AND p.level >= 'read'::auth.permission
        LEFT JOIN auth.users u ON u.id = t.user_id
        LEFT JOIN shop.items i ON i.id = t.item_id
        WHERE t.shop_id = ${shopId}::uuid ${isManager ? sql`` : sql`AND t.user_id = ${auth.userId}`}
        ORDER BY t.created_at DESC, t.id DESC
        LIMIT ${perPage} OFFSET ${offset}
      `;

      const [countRow] = await sql`
        SELECT COUNT(*) AS count
        FROM shop.transactions t
        JOIN auth.policies p ON p.scope = 'shop:' || t.shop_id AND p.user_id = ${auth.userId} AND p.level >= 'read'::auth.permission
        WHERE t.shop_id = ${shopId}::uuid ${isManager ? sql`` : sql`AND t.user_id = ${auth.userId}`}
      `;

      return {
        data: data as Transaction[],
        total: Number(countRow.count),
        page,
        perPage,
      };
    },
  }),
};
