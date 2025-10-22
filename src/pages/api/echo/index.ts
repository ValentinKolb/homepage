import { common } from "@/lib/utils/crypto";
import type { APIRoute } from "astro";

/**
 * Universal handler for echo endpoint that returns the request body unchanged.
 *
 * Acts as a pass-through endpoint that preserves the original content type and body.
 * Returns "Pong" (text/plain) if no body is provided.
 * Useful for testing and debugging HTTP requests.
 *
 * @returns Response with the same body and content type as the request
 */
const handler: APIRoute = async ({ params, request }) => {
  // Just pass through the raw body without parsing
  return new Response(request.body ?? "Pong", {
    status: 200,
    headers: {
      "Content-Type": request.headers.get("Content-Type") || "text/plain",
      "X-Request-ID":
        request.headers.get("X-Request-ID") || common.readableId(),
      "X-Custom-Header": "Hello from the echo server",
      "X-Request-Method": request.method,
      "X-Request-Params-JSON": JSON.stringify(params),
    },
  });
};

// Expose handler for GET, POST, PUT, and DELETE methods
export const ALL = handler;
