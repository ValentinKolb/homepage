import { ActionError, defineAction } from "astro:actions";
import { z } from "astro:schema";
import { redis, sql } from "bun";
import superjson from "superjson";
import { type UserModel } from "./types";
import { common } from "@/lib/utils/crypto";
import { defined } from "@/lib/utils/api";

const CACHE_TTL = 300; // 5 minutes in seconds

export const usrImg = (id: string) => `/api/img/auth/user/${id}`;

export const userActions = {
  /**
   * Public user profile
   *
   * @param userId - The ID of the user to retrieve.
   * @returns A promise that resolves to the user profile.
   */
  get: defineAction({
    input: z.object({
      userId: z.string(),
    }),
    handler: async ({ userId }) => {
      const cacheKey = `user:${userId}`;

      // Try cache first
      const cached = await redis.get(cacheKey);
      if (cached) {
        // Refresh TTL on cache hit
        await redis.expire(cacheKey, CACHE_TTL);
        return superjson.parse(cached) as UserModel;
      }

      // Query database
      const [row] = await sql`
        SELECT id, username, public_key as "publicKey", (img_data IS NOT NULL) AS has_img
        FROM auth.users
        WHERE id = ${userId}
      `;

      if (!row) throw new ActionError({ code: "NOT_FOUND" });

      const user = {
        ...row,
        imgSrc: row.has_img ? usrImg(row.id) : null,
      };

      await redis.set(cacheKey, superjson.stringify(user), "EX", CACHE_TTL);

      return user as UserModel;
    },
  }),

  /** Register a new user */
  register: defineAction({
    input: z.object({
      username: z.string().min(2).max(30),
      publicKey: z.string().min(64).max(256),
    }),
    handler: async ({ username, publicKey }) => {
      const id = common.readableId();
      await sql`INSERT INTO auth.users (id, username, public_key) VALUES (${id}, ${username}, ${publicKey})`;
      return { id };
    },
  }),

  /** Update user profile */
  update: defineAction({
    input: z.object({
      username: z.string().min(2).max(30).trim().optional(),
      publicKey: z.string().min(64).max(256).optional(),
      img_data: z.string().nullable().optional(),
    }),
    handler: async (data, { locals: { auth } }) => {
      if (!auth) throw new ActionError({ code: "UNAUTHORIZED" });

      const [updated] = await sql`
        UPDATE auth.users AS u
        SET ${sql(defined({ ...data, updated_at: new Date() }))}
        WHERE u.id = ${auth.userId}
        RETURNING u.id, u.username, u.public_key as "publicKey", (u.img_data IS NOT NULL) AS has_img
      `;

      if (!updated) {
        throw new ActionError({
          code: "BAD_REQUEST",
          message: "Update failed",
        });
      }

      // Invalidate cache
      await redis.del(`user:${auth.userId}`);

      return {
        ...updated,
        imgSrc: updated.has_img ? usrImg(updated.id) : null,
      } as UserModel;
    },
  }),

  /** Delete a user */
  delete: defineAction({
    handler: async (_, { locals: { auth } }) => {
      // Only allow users to delete their own account
      if (!auth) throw new ActionError({ code: "UNAUTHORIZED" });

      // Delete user from database
      await sql`DELETE FROM auth.users WHERE id = ${auth.userId}`;

      // Invalidate user cache
      await redis.del(`user:${auth.userId}`);

      // Invalidate session cache, all session id's are prefixed with the userId
      await Promise.all(
        (await redis.keys(`session:${auth.userId}*`)).map((key) =>
          redis.del(key),
        ),
      );

      return { success: true };
    },
  }),
};
