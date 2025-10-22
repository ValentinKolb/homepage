import { sequence } from "astro:middleware";
import { sessionMiddleware } from "./actions/auth/session";

/**
 * Main middleware sequence
 */
export const onRequest = sequence(sessionMiddleware);
