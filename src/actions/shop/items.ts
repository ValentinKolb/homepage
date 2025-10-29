import { ActionError, defineAction } from "astro:actions";
import { z } from "astro:schema";
import { sql } from "bun";
import { PaginationSchema } from "../util";
import type { ShopItem } from "./types";

export const itemImg = (id: string) => `/api/img/shop/item/${id}`;

// ==========================
// Shop Item Actions
// ==========================

export const shopItemActions = {
  /**
   * Get single item by ID or EAN13
   * @returns Item with stock or null if not found
   */
  get: defineAction({
    input: z.object({
      idOrEan13: z.string(),
    }),
    handler: async ({ idOrEan13 }) => {
      // Public access - no auth required

      const [row] = await sql`
        SELECT s.id, s.shop_id AS "shopId", s.name, s.description, s.ean13, s.price_cents AS "priceCents",
               s.active, s.stock, s.tags, (s.img_data IS NOT NULL) AS "hasImg", s.created_at AS "createdAt", s.updated_at AS "updatedAt"
        FROM shop.items_with_stock s
        WHERE s.id = ${idOrEan13} OR s.ean13 = ${idOrEan13}
      `;

      if (!row) return null;

      return {
        ...row,
        imgSrc: row.hasImg ? itemImg(row.id) : null,
      } as ShopItem;
    },
  }),

  /**
   * List active items for a shop with pagination and search
   * @returns Paginated list of items
   */
  list: defineAction({
    input: z
      .object({
        shopId: z.string(),
        search: z.string().default(""),
        tag: z.string().optional(),
      })
      .and(PaginationSchema),
    handler: async ({ shopId, search, tag, perPage, page, offset }) => {
      // Public access - no auth required

      // Get items with stock
      const items = await sql`
        SELECT s.id, s.shop_id AS "shopId", s.stock, s.name, s.description, s.ean13, s.active,
               s.price_cents AS "priceCents", s.tags, (s.img_data IS NOT NULL) AS "hasImg",
               s.created_at AS "createdAt", s.updated_at AS "updatedAt"
        FROM shop.items_with_stock s
        WHERE s.shop_id = ${shopId} AND s.active = true AND s.name ILIKE ${`%${search}%`}
          ${tag ? sql`AND ${tag} = ANY(s.tags)` : sql``}
        ORDER BY s.created_at DESC
        LIMIT ${perPage} OFFSET ${offset}
      `;

      // Get total count
      const [totalRow] = await sql`
        SELECT COUNT(*) AS count
        FROM shop.items
        WHERE shop_id = ${shopId} AND active = true AND name ILIKE ${`%${search}%`}
          ${tag ? sql`AND ${tag} = ANY(tags)` : sql``}
      `;

      const data = items.map((row: any) => ({
        ...row,
        imgSrc: row.hasImg ? itemImg(row.id) : null,
      })) as ShopItem[];

      return {
        data,
        total: Number(totalRow.count),
        page: page,
        perPage: perPage,
      };
    },
  }),

  /**
   * Create new item (requires manage permission)
   * @returns Created item
   */
  create: defineAction({
    input: z.object({
      shopId: z.string(),
      name: z.string().min(1).max(100),
      description: z.string().max(500).nullable().optional(),
      priceCents: z.number().int().min(0),
    }),
    handler: async (data, { locals: { auth } }) => {
      if (!auth) throw new ActionError({ code: "UNAUTHORIZED" });

      const now = new Date();
      const [created] = await sql`
        WITH ins AS (
          INSERT INTO shop.items (shop_id, name, description, ean13, price_cents, img_data, active, tags, created_at, updated_at)
          SELECT ${data.shopId}, ${data.name}, ${data.description ?? null}, NULL, ${data.priceCents}, NULL, true, '{}', ${now}, ${now}
          FROM auth.policies p
          WHERE p.scope = 'shop:' || ${data.shopId} AND p.user_id = ${auth.userId} AND p.level >= 'manage'::auth.permission
          RETURNING *
        )
        SELECT i.id, i.shop_id AS "shopId", i.name, i.description, i.ean13, i.price_cents AS "priceCents",
               i.active, 0 AS stock, i.tags, (i.img_data IS NOT NULL) AS "hasImg"
        FROM ins i
      `;

      if (!created) {
        throw new ActionError({
          code: "FORBIDDEN",
          message: "No manage permission for this shop.",
        });
      }

      return {
        ...created,
        imgSrc: created.hasImg ? itemImg(created.id) : null,
      } as ShopItem;
    },
  }),

  /**
   * Update existing item (requires manage permission)
   * @returns Updated item
   */
  update: defineAction({
    input: z.object({
      itemId: z.string(),
      name: z.string().min(1).max(100).optional(),
      description: z.string().max(500).nullable().optional(),
      ean13: z
        .string()
        .regex(/^\d{13}$/)
        .nullable()
        .optional(),
      priceCents: z.number().int().min(0).optional(),
      imgData: z.string().nullable().optional(),
      active: z.boolean().optional(),
      tags: z.array(z.string()).optional(),
    }),
    handler: async ({ itemId, ...data }, { locals: { auth } }) => {
      if (!auth) throw new ActionError({ code: "UNAUTHORIZED" });

      const hasUpdates = Object.keys(data).length > 0;
      if (!hasUpdates)
        throw new ActionError({
          code: "BAD_REQUEST",
          message: "No changes to update.",
        });

      const [updated] = await sql`
        WITH upd AS (
          UPDATE shop.items AS i
          SET
            ${data.name ? sql`name = ${data.name},` : sql``}
            ${data.description ? sql`description = ${data.description},` : sql``}
            ${data.ean13 ? sql`ean13 = ${data.ean13},` : sql``}
            ${data.priceCents ? sql`price_cents = ${data.priceCents},` : sql``}
            ${data.active !== undefined ? sql`active = ${data.active},` : sql``}
            ${data.imgData ? sql`img_data = ${data.imgData},` : sql``}
            ${data.tags ? sql`tags = ${"{" + data.tags.join(",") + "}"},` : sql``}
            updated_at = NOW()
          FROM auth.policies p
          WHERE i.id = ${itemId} AND p.scope = 'shop:' || i.shop_id AND p.user_id = ${auth.userId} AND p.level >= 'manage'::auth.permission
          RETURNING i.*
        )
        SELECT u.id, u.shop_id AS "shopId", u.name, u.description, u.ean13, u.price_cents AS "priceCents",
               u.active, u.tags, (u.img_data IS NOT NULL) AS "hasImg",
               COALESCE((SELECT SUM(t.item_amount) FROM shop.transactions t WHERE t.item_id = u.id), 0) AS stock
        FROM upd u
      `;

      if (!updated) {
        throw new ActionError({
          code: "FORBIDDEN",
          message: "No manage permission or item not found.",
        });
      }

      return {
        ...updated,
        imgSrc: updated.hasImg ? itemImg(updated.id) : null,
      } as ShopItem;
    },
  }),

  /**
   * Delete item (requires manage permission)
   */
  delete: defineAction({
    input: z.object({
      itemId: z.string(),
    }),
    handler: async ({ itemId }, { locals: { auth } }) => {
      if (!auth) throw new ActionError({ code: "UNAUTHORIZED" });

      const result = await sql`
        DELETE FROM shop.items i
        USING auth.policies p
        WHERE i.id = ${itemId} AND p.scope = 'shop:' || i.shop_id AND p.user_id = ${auth.userId} AND p.level >= 'manage'::auth.permission
      `;

      if (result.count === 0) {
        throw new ActionError({
          code: "FORBIDDEN",
          message: "No manage permission or item not found.",
        });
      }
    },
  }),

  /**
   * Get all unique tags from items in a shop
   * @returns Array of unique tags
   */
  tags: defineAction({
    input: z.object({
      shopId: z.string(),
    }),
    handler: async ({ shopId }) => {
      // Public access - no auth required

      // Get all unique tags using PostgreSQL's array functions
      const [result] = await sql`
        SELECT ARRAY(
          SELECT DISTINCT unnest(tags)
          FROM shop.items
          WHERE shop_id = ${shopId} AND active = true
          ORDER BY 1
        ) AS tags
      `;

      return (result?.tags || []) as string[];
    },
  }),
};
