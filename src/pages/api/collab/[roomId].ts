import { publishToRoom, createSSEStream } from "@/lib/sse/server";
import type { APIRoute } from "astro";

/**
 * POST endpoint for broadcasting messages to a room.
 *
 * Expects a roomId as path parameter like /api/collab/123
 *
 * @returns 204 on success, 400 on error
 */
export const POST: APIRoute = async ({ params, request }) => {
  const { roomId } = params;
  const msgType = request.headers.get("x-msg-type");
  if (!roomId || !msgType)
    return new Response("Missing roomId or msgType", { status: 400 });
  try {
    await publishToRoom(roomId, msgType, await request.text());
    return new Response(null, { status: 204 });
  } catch (error) {
    return new Response(`${(error as Error).message}`, { status: 400 });
  }
};

/**
 * GET endpoint for Server-Sent Events stream to receive real-time updates.
 *
 * Expects a roomId as path parameter like /api/collab/123
 *
 * @returns SSE stream with real-time messages
 */
export const GET: APIRoute = async ({ params, request }) => {
  const { roomId } = params;
  if (!roomId) return new Response("Missing roomId", { status: 400 });

  const { body, headers } = createSSEStream(roomId, request);

  return new Response(body, { headers });
};
