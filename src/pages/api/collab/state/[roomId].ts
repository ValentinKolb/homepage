import type { APIRoute } from "astro";
import { sql } from "bun";

/**
 * GET endpoint for getting the on the server stored state of a room
 *
 * Expects a roomId as path parameter like /api/collab/state/123
 *
 * @returns The Uint8Array representing the state of the room
 */
export const GET: APIRoute = async ({ params }) => {
  const { roomId } = params;
  if (!roomId) return new Response("Missing roomId", { status: 400 });

  const [row] =
    await sql`SELECT text_blob FROM collab.blob WHERE id = ${roomId}`.catch(
      (error) => {
        console.error("[COLLAB ERROR] Error loading state:", error);
        return new Response("Error loading state", { status: 500 });
      },
    );

  if (!row) return new Response("No state found", { status: 404 });
  return Response.json({ state: row.text_blob });
};
