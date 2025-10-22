import { ActionError, defineAction } from "astro:actions";
import { z } from "astro:schema";
import { sql } from "bun";
import { PaginationSchema } from "../util";
import type { Shop } from "./types";
import { defined } from "@/lib/utils/api";
import { shopItemActions } from "./items";
import { shopTransactionActions } from "./transactions";
import { shopUserActions } from "./users";

import type { Permission } from "@/actions/auth/types";

// ==========================
// Shop Actions
// ==========================

export const shopActions = {
  items: shopItemActions,
  transactions: shopTransactionActions,
  users: shopUserActions,
  /**
   * Get shop by ID with user's permission and balance
   * @returns Shop with userPermission
   * @throws Error if user has no permission
   */
  get: defineAction({
    input: z.object({
      shopId: z.string(),
    }),
    handler: async ({ shopId }, { locals: { auth } }) => {
      let row;
      if (auth) {
        [row] = await sql`
        SELECT k.id, k.name, k.description, p.level AS "userPermission", COALESCE(b.balance_cents, 0) AS "userBalance"
        FROM shop.metadata k
        JOIN auth.policies p ON p.scope = 'shop:' || k.id AND p.user_id = ${auth.userId}
        LEFT JOIN shop.user_balances b ON b.shop_id = k.id AND b.user_id = ${auth.userId}
        WHERE k.id = ${shopId}
      `;
      } else {
        [row] = await sql`
          SELECT k.id, k.name, k.description, NULL AS "userPermission", NULL AS "userBalance"
          FROM shop.metadata k
          WHERE k.id = ${shopId}
        `;
      }

      if (!row) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Shop not found.",
        });
      }

      return row as Shop;
    },
  }),

  /**
   * List shops where user has a permission
   * @returns Paginated list of shops
   */
  list: defineAction({
    input: PaginationSchema,
    handler: async (pagination, { locals: { auth } }) => {
      if (!auth) throw new ActionError({ code: "UNAUTHORIZED" });

      const data = await sql`
        SELECT k.id, k.name, k.description, p.level AS "userPermission", COALESCE(b.balance_cents, 0) AS "userBalance"
        FROM shop.metadata k
        JOIN auth.policies p ON p.scope = 'shop:' || k.id AND p.user_id = ${auth.userId}
        LEFT JOIN shop.user_balances b ON b.shop_id = k.id AND b.user_id = ${auth.userId}
        ORDER BY k.name ASC
        LIMIT ${pagination.perPage} OFFSET ${pagination.offset}
      `;

      const [countRow] = await sql`
        SELECT COUNT(*) AS count
        FROM shop.metadata k
        JOIN auth.policies p ON p.scope = 'shop:' || k.id AND p.user_id = ${auth.userId}
      `;

      return {
        data: data as Shop[],
        total: Number(countRow.count),
        page: pagination.page,
        perPage: pagination.perPage,
      };
    },
  }),

  /**
   * Create new shop (user becomes manager)
   * @returns Created shop
   */
  create: defineAction({
    input: z.object({
      name: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
    }),
    handler: async ({ name, description }, { locals: { auth } }) => {
      if (!auth) throw new ActionError({ code: "UNAUTHORIZED" });

      return await sql.begin(async (tx) => {
        const [shop] = await tx`
          INSERT INTO shop.metadata (name, description)
          VALUES (${name}, ${description ?? null})
          RETURNING id, name, description
        `;

        // Bootstrap: creator gets manage permission
        await tx`
          INSERT INTO auth.policies (user_id, scope, level, granted_by)
          VALUES (${auth.userId}, 'shop:' || ${shop.id}, 'manage', ${auth.userId})
        `;

        return {
          id: shop.id,
          name: shop.name,
          description: shop.description,
          userPermission: "manage" as Permission,
          userBalance: 0,
        } as Shop;
      });
    },
  }),

  /**
   * Update existing shop (requires manage permission)
   * @returns Updated shop or throws error
   */
  update: defineAction({
    input: z.object({
      shopId: z.string(),
      name: z.string().min(1).max(100).optional(),
      description: z.string().max(500).nullable().optional(),
    }),
    handler: async ({ shopId, ...data }, { locals: { auth } }) => {
      if (!auth) throw new ActionError({ code: "UNAUTHORIZED" });

      if (Object.keys(defined(data)).length === 0) {
        throw new ActionError({
          code: "BAD_REQUEST",
          message: "No fields to update.",
        });
      }

      const [updated] = await sql`
        UPDATE shop.metadata AS k
        SET ${sql(defined({ ...data, updated_at: new Date() }))}
        FROM auth.policies AS p
        WHERE k.id = ${shopId} AND p.scope = 'shop:' || k.id AND p.user_id = ${auth.userId} AND p.level >= 'manage'::auth.permission
        RETURNING k.id, k.name, k.description, 'manage'::auth.permission AS "userPermission",
          (SELECT COALESCE(balance_cents, 0) FROM shop.user_balances WHERE shop_id = k.id AND user_id = ${auth.userId}) AS "userBalance"
      `;

      if (!updated) {
        throw new ActionError({
          code: "FORBIDDEN",
          message: "No permission or shop not found.",
        });
      }

      return updated as Shop;
    },
  }),

  /**
   * Delete shop (requires manage permission)
   */
  delete: defineAction({
    input: z.object({
      shopId: z.string(),
    }),
    handler: async ({ shopId }, { locals: { auth } }) => {
      if (!auth) throw new ActionError({ code: "UNAUTHORIZED" });

      const result = await sql`
        DELETE FROM shop.metadata k
        USING auth.policies p
        WHERE k.id = ${shopId} AND p.scope = 'shop:' || k.id AND p.user_id = ${auth.userId} AND p.level >= 'manage'::auth.permission
      `;

      if (result.count === 0) {
        throw new ActionError({
          code: "FORBIDDEN",
          message: "No permission or shop not found.",
        });
      }
    },
  }),
};
