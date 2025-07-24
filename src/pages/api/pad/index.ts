import type { APIRoute } from "astro";
import BroadcastManager from "./broadcast";

/**
 * POST endpoint for broadcasting messages to a pad room.
 *
 * @param roomId - Query parameter identifying the pad room
 * @param body - Message content to broadcast
 * @returns 204 on success, 400 on error
 */
export const POST: APIRoute = async ({ request, url }) => {
  try {
    const roomId = url.searchParams.get("roomId");

    if (!roomId) {
      return new Response("Missing roomId parameter", {
        status: 400,
      });
    }

    const message = await request.text();

    if (!message) {
      return new Response("Missing body", { status: 400 });
    }

    BroadcastManager.getInstance().broadcast(roomId, message);
    return new Response(null, { status: 204 });
  } catch (error) {
    return new Response("Failed to read request", { status: 400 });
  }
};

/**
 * GET endpoint for Server-Sent Events stream to receive real-time updates.
 *
 * @param roomId - Query parameter identifying the pad room to subscribe to
 * @returns SSE stream with real-time messages
 */
export const GET: APIRoute = async ({ request, url }) => {
  const roomId = url.searchParams.get("roomId");

  if (!roomId) {
    return new Response("Missing roomId parameter", { status: 400 });
  }

  const body = new ReadableStream({
    start(controller) {
      const sendEvent = (message: string) => {
        controller.enqueue(`data: ${message}\n\n`);
      };

      // Subscribe to messages for this room
      const unsubscribe = BroadcastManager.getInstance().subscribe(
        roomId,
        sendEvent,
      );

      // Handle connection closing
      request.signal.addEventListener("abort", () => {
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  });
};
