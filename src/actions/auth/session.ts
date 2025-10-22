import { ActionError, defineAction } from "astro:actions";
import { z } from "astro:schema";
import { redis, sql } from "bun";
import { asymmetric, common } from "@/lib/utils/crypto";
import type { MiddlewareHandler } from "astro";

declare global {
  namespace App {
    interface Locals {
      auth?: {
        sessionId: string;
        userId: string;
      };
    }
  }
}

export const SESSION_TTL = 86400 * 30; // 30 days in seconds

export const sessionActions = {
  get: defineAction({
    handler: async (_, { locals: { auth } }) =>
      auth ? { success: true, sessionId: auth.sessionId } : { success: false },
  }),

  /**
   * Create a new session for a user.
   *
   * It is possible to create a session using a nonce and a signature, or a nonce and a TOTP code.
   */
  create: defineAction({
    input: z.object({
      userId: z.string(),
      nonce: z.string(),
      timestamp: z.number().int(),
      signature: z.string(),
    }),

    handler: async ({ userId, nonce, signature, timestamp }, ctx) => {
      // Check if nonce was already used
      if (await redis.exists(`nonce:${nonce}`)) {
        throw new ActionError({ code: "BAD_REQUEST" });
      }
      // Store nonce to prevent replay (5 minutes)
      await redis.set(`nonce:${nonce}`, "1", "EX", 60 * 5);

      // store whether the user is verified
      let isValid = false;

      // Determine which auth method is being used
      // Get user for ID
      const [user] =
        await sql`SELECT public_key as "publicKey" FROM auth.users WHERE id = ${userId}`;
      if (!user) {
        throw new ActionError({ code: "NOT_FOUND" });
      }

      // Verify signature
      isValid = await asymmetric.verify({
        publicKey: user.publicKey,
        signature,
        nonce,
        timestamp,
        message: userId,
      });

      if (!isValid) {
        throw new ActionError({ code: "UNAUTHORIZED" });
      }

      // Create session, the session id is prefixed with the user id for easy queries
      const sessionId = `${userId}-${common.readableId()}`;

      // Set session in redis
      const session = { userId, createdAt: Date.now().toString() };
      await redis.hmset(`session:${sessionId}`, Object.entries(session).flat());
      await redis.expire(`session:${sessionId}`, SESSION_TTL);

      // Set session cookie
      ctx.cookies.set("session", sessionId, {
        httpOnly: true,
        secure: import.meta.env.DEV,
        sameSite: "strict",
        path: "/",
        maxAge: SESSION_TTL,
        expires: new Date(Date.now() + SESSION_TTL * 1000),
      });

      return session;
    },
  }),

  /**
   * Invalidate a session.
   */
  invalidate: defineAction({
    handler: async (_, { locals: { auth }, cookies }) => {
      // Only allow sessions to invalidate themselves
      if (!auth) throw new ActionError({ code: "UNAUTHORIZED" });

      // Find and delete session
      await redis.del(`session:${auth.sessionId}`);

      // Delete session cookie
      cookies.delete("session");

      return { success: true };
    },
  }),
};

/**
 * Session auth middleware for Astro
 * Check if session is valid and set locals.auth
 */
export const sessionMiddleware: MiddlewareHandler = async (context, next) => {
  // Skip on prerendered pages
  if (context.isPrerendered) return await next();

  // Get cookie header
  const sessionId = context.cookies.get("session")?.value;
  const [userId] = sessionId
    ? await redis.hmget(`session:${sessionId}`, ["userId"])
    : [null];

  // Valid session
  if (sessionId && userId) {
    // Refresh session
    await redis.expire(`session:${sessionId}`, SESSION_TTL);

    // Sets locals.auth
    context.locals.auth = {
      sessionId: sessionId,
      userId: userId,
    };
  } else if (sessionId) {
    // Invalid session, delete session cookie and session data
    context.cookies.delete("session");
    await redis.del(`session:${sessionId}`);
  }

  // Call next middleware
  return await next();
};
