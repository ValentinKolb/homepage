import { ActionError, defineAction } from "astro:actions";
import { z } from "astro:schema";
import { sql } from "bun";
import { PaginationSchema } from "../util";
import type { ShopUser } from "./types";
import { usrImg } from "@/actions/auth/user";

// ==========================
// Shop User Management
// ==========================

export const shopUserActions = {
  /**
   * Add permission for a user to a shop (requires manage permission)
   */
  add: defineAction({
    input: z.object({
      shopId: z.string(),
      userId: z.string(),
      permission: z.enum(["read", "use", "manage"]),
    }),
    handler: async ({ shopId, userId, permission }, { locals: { auth } }) => {
      if (!auth) throw new ActionError({ code: "UNAUTHORIZED" });

      // Check if user has manage permission
      const [policy] = await sql`
        SELECT 1 FROM auth.policies
        WHERE scope = 'shop:' || ${shopId} AND user_id = ${auth.userId} AND level >= 'manage'::auth.permission
      `;

      if (!policy) {
        throw new ActionError({
          code: "FORBIDDEN",
          message: "No manage permission for this shop.",
        });
      }

      // Insert or upgrade permission (never downgrade)
      await sql`
        INSERT INTO auth.policies (user_id, scope, level, granted_by)
        VALUES (${userId}, 'shop:' || ${shopId}, ${permission}::auth.permission, ${auth.userId})
        ON CONFLICT (user_id, scope)
        DO UPDATE SET level = EXCLUDED.level, granted_by = EXCLUDED.granted_by
        WHERE EXCLUDED.level > auth.policies.level
      `;
    },
  }),

  /**
   * Remove permission from user (requires manage permission)
   */
  remove: defineAction({
    input: z.object({
      shopId: z.string(),
      userId: z.string(),
    }),
    handler: async ({ shopId, userId }, { locals: { auth } }) => {
      if (!auth) throw new ActionError({ code: "UNAUTHORIZED" });

      // Prevent self-revoke
      if (userId === auth.userId) {
        throw new ActionError({
          code: "BAD_REQUEST",
          message: "Cannot revoke your own permission.",
        });
      }

      // Check if user has manage permission
      const [policy] = await sql`
        SELECT 1 FROM auth.policies
        WHERE scope = 'shop:' || ${shopId} AND user_id = ${auth.userId} AND level >= 'manage'::auth.permission
      `;

      if (!policy) {
        throw new ActionError({
          code: "FORBIDDEN",
          message: "No manage permission for this shop.",
        });
      }

      const result = await sql`
        DELETE FROM auth.policies
        WHERE scope = 'shop:' || ${shopId} AND user_id = ${userId}
      `;

      if (result.count === 0) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Target user has no permissions for this shop.",
        });
      }
    },
  }),

  /**
   * List all users with permissions for a shop
   * @returns List of users with permissions, includes balance if requester is manager or it's their own balance
   */
  list: defineAction({
    input: z
      .object({
        shopId: z.string(),
        search: z.string().optional(),
      })
      .and(PaginationSchema),
    handler: async (
      { shopId, search, perPage, page, offset },
      { locals: { auth } },
    ) => {
      let isManager = false;
      if (auth) {
        const [policy] = await sql`
          SELECT level FROM auth.policies
          WHERE scope = 'shop:' || ${shopId} AND user_id = ${auth.userId} AND level >= 'read'::auth.permission
        `;

        isManager = policy?.level === "manage" || policy?.level === "admin";
      }

      // Fetch all users with permissions
      const rows = await sql`
        SELECT p.user_id AS "userId", p.level AS "userPermission", u.username,
               (u.img_data IS NOT NULL) AS "hasImg",
               CASE
                 WHEN ${isManager && auth} OR p.user_id = ${auth?.userId ?? null} THEN b.balance_cents
                 ELSE NULL
               END AS "userBalance"
        FROM auth.policies p
        JOIN auth.users u ON u.id = p.user_id
        LEFT JOIN shop.user_balances b ON b.shop_id = ${shopId} AND b.user_id = p.user_id
        WHERE p.scope = 'shop:' || ${shopId} ${search ? sql`AND u.username ILIKE ${`%${search}%`}` : sql``}
        ORDER BY
          CASE WHEN p.level = 'manage' THEN 1 WHEN p.level = 'use' THEN 2 WHEN p.level = 'read' THEN 3 ELSE 4 END,
          u.username ASC
        LIMIT ${perPage} OFFSET ${offset}
      `;

      const [countRow] = await sql`
        SELECT COUNT(*) AS count
        FROM auth.policies p
        JOIN auth.users u ON u.id = p.user_id
        WHERE p.scope = 'shop:' || ${shopId}
          ${search ? sql`AND u.username ILIKE ${`%${search}%`}` : sql``}
      `;

      const data = rows.map((row: any) => ({
        userId: row.userId,
        username: row.username,
        userPermission: row.userPermission,
        userBalance: row.userBalance,
        imgSrc: row.hasImg ? usrImg(row.userId) : null,
      })) as ShopUser[];

      return {
        data,
        total: Number(countRow.count),
        page,
        perPage,
      };
    },
  }),
};
