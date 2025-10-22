import config from "@/config/config";
import { asymmetric, symmetric, totp } from "@/lib/utils/crypto";
import { ActionError, defineAction } from "astro:actions";
import { z } from "astro:schema";
import { sql } from "bun";
import { PaginationSchema } from "../util";
const { APP_NAME, APP_SECRET } = config;

/**
 * Verifies a token against all user's TOTP secrets
 * @returns True if the token is valid, false otherwise
 */
export const verifyTokenForUser = async (userId: string, token: string) => {
  // Get all user's TOTP secrets
  const rows =
    await sql`SELECT encrypted_secret FROM auth.totp WHERE user_id = ${userId}`;

  if (!rows || rows.length === 0) return false;

  // Check if any secret matches the token
  for (const row of rows) {
    const secret = await symmetric.decrypt({
      key: APP_SECRET,
      payload: row.encrypted_secret,
    });
    if (await totp.verify({ secret, token })) return true;
  }

  return false;
};

export const totpActions = {
  create: defineAction({
    input: z.object({
      label: z
        .string()
        .optional()
        .default(() => `TOTP_${new Date().toISOString()}`),
    }),
    handler: async ({ label }, { locals: { auth } }) => {
      if (!auth) throw new ActionError({ code: "UNAUTHORIZED" });

      // Get user public key
      const [user] =
        await sql`SELECT public_key FROM auth.users WHERE id = ${auth.userId}`;
      if (!user) throw new ActionError({ code: "NOT_FOUND" });

      // Create TOTP URI and secret
      const { uri, secret } = await totp.create({ label, issuer: APP_NAME });

      // Encrypt the secret for db storage
      const encryptedSecret = await symmetric.encrypt({
        key: APP_SECRET,
        payload: secret,
        stretched: false, // APP_SECRET has high entropy
      });

      // Encrypt the URI for asymmetric encryption before sending it to the user
      const encryptedUri = await asymmetric.encrypt({
        publicKey: user.public_key,
        payload: uri,
      });

      // Store the TOTP in the database
      const [newTotp] =
        await sql`INSERT INTO auth.totp (user_id, label, encrypted_secret) VALUES (${auth.userId}, ${label}, ${encryptedSecret}) RETURNING id`;

      return { success: true, encryptedUri, id: newTotp.id };
    },
  }),

  validate: defineAction({
    input: z.object({
      totpId: z.string(),
      token: z.string().min(6).max(6),
    }),
    handler: async ({ totpId, token }, { locals: { auth } }) => {
      if (!auth) throw new ActionError({ code: "UNAUTHORIZED" });

      // Get the TOTP from the database
      const [row] = await sql`
        SELECT encrypted_secret FROM auth.totp
        WHERE id = ${totpId} AND user_id = ${auth.userId}
      `;
      if (!row) throw new ActionError({ code: "NOT_FOUND" });

      // Decrypt the secret
      const secret = await symmetric.decrypt({
        key: APP_SECRET,
        payload: row.encrypted_secret,
      });

      // Verify the code
      const isValid = await totp.verify({
        token,
        secret,
      });

      return { valid: isValid };
    },
  }),

  list: defineAction({
    input: PaginationSchema,
    handler: async ({ perPage, page, offset }, { locals: { auth } }) => {
      if (!auth) throw new ActionError({ code: "UNAUTHORIZED" });

      // Get all TOTPs for the user
      const totps = await sql`
        SELECT id, label, created_at FROM auth.totp
        WHERE user_id = ${auth.userId}
        ORDER BY created_at DESC LIMIT ${perPage} OFFSET ${offset}
      `;

      const [totalRow] =
        await sql`SELECT COUNT(*) AS count FROM auth.totp WHERE user_id = ${auth.userId} `;

      return {
        data: totps as [{ id: string; label: string; created_at: Date }],
        total: Number(totalRow.count),
        page: page,
        perPage: perPage,
      };
    },
  }),

  delete: defineAction({
    input: z.object({
      totpId: z.string(),
    }),
    handler: async ({ totpId }, { locals: { auth } }) => {
      if (!auth) throw new ActionError({ code: "UNAUTHORIZED" });

      // Delete TOTP (only for the current user)
      await sql`DELETE FROM auth.totp WHERE id = ${totpId} AND user_id = ${auth.userId}`;

      return { success: true };
    },
  }),
};
