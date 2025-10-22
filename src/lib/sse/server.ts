import { console } from "inspector";
import BroadcastManager from "./lib/broadcast";
import type { BaseSyncMessage } from "./client";
import { sql } from "bun";
import { createTimedBuffer } from "@/lib/utils/timing";

/**
 * Server-side SSE utilities for real-time collaboration.
 * Abstracts away the HTTP/SSE implementation details.
 */

const encoder = new TextEncoder();

// ================
// db helpers
// ================

/**
 * This function saves the state of a room to the database.
 * @param roomId - The ID of the room to save the state for.
 * @param message - The encrypted state to save.
 */
const saveState = createTimedBuffer(async (roomId: string, message: string) => {
  // persist snapshot in database (the snapshot is end to end encrypted)
  await sql`
     INSERT INTO collab.blob (id, text_blob)
     VALUES (${roomId}, ${message})
     ON CONFLICT (id)
     DO UPDATE SET text_blob = EXCLUDED.text_blob
   `.catch((error) => {
    console.error("[COLLAB ERROR] Error persisting snapshot:", error);
    throw error;
  });
});

const loadState = async (roomId: string) => {
  console.log("Loading state for room:", roomId);

  // load snapshot from database
  const [row] =
    await sql`SELECT text_blob FROM collab.blob WHERE id = ${roomId}`.catch(
      (error) => {
        console.error("[COLLAB ERROR] Error loading snapshot:", error);
        throw error;
      },
    );

  return row?.text_blob || undefined;
};

// ================
// Public API
// ================

/**
 * Creates a Server-Sent Events stream for real-time updates.
 *
 * @param roomId - The room to subscribe to
 * @param request - The incoming request (for abort signal)
 * @returns Object with body and headers for SSE response
 */
export function createSSEStream(
  roomId: string,
  request: Request,
): { body: ReadableStream<Uint8Array>; headers: HeadersInit } {
  const body = new ReadableStream({
    start(controller) {
      const sendEvent = (message: any) => {
        const data = encoder.encode(`data: ${message}\n\n`);
        controller.enqueue(data);
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

  return {
    body,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  };
}

/**
 * Publishes a message to all subscribers in a room.
 *
 * @param roomId - The room to publish to
 * @param message - The message content
 */
export async function publishToRoom(
  roomId: string,
  msgType: BaseSyncMessage["type"],
  body: string,
) {
  // persist state (don't broadcast this message since it is only meant for the server)
  if (msgType === "send-state") return saveState(roomId, body);

  // broadcast all other messages to all subscribers in the room
  BroadcastManager.getInstance().broadcast(roomId, body);

  // sent saved state if new member joins
  if (msgType === "request-snapshot") {
    const state = await loadState(roomId);
    if (state) BroadcastManager.getInstance().broadcast(roomId, state);
  }
}
