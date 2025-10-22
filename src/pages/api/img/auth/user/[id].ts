import { fromBase64 } from "@/lib/utils/encoding";
import type { APIRoute } from "astro";
import { sql } from "bun";

/**
 * Get user profile image by ID
 */
export const GET: APIRoute = async (context) => {
  const { id } = context.params;

  const [row] = await sql`select img_data from auth.users where id = ${id}`;

  if (!row) {
    return new Response("User not found", { status: 404 });
  }

  if (!row.img_data) {
    return new Response("No profile image", { status: 404 });
  }

  try {
    // Parse base64 data URL (e.g., "data:image/jpeg;base64,/9j/4AAQ...")
    const [mimeInfo, base64Data] = row.img_data.split(",");
    const mimeType = mimeInfo.match(/:(.*?);/)?.[1] || "image/jpeg";

    // Convert base64 to binary
    const bytes = fromBase64(base64Data);

    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=2, must-revalidate", // 2 seconds
        "Content-Length": bytes.length.toString(),
      },
    });
  } catch (error) {
    console.error("Failed to parse profile image:", error);
    return new Response("Invalid image data", { status: 400 });
  }
};
