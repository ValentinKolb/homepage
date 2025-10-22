import { JSONResponse } from "@/lib/utils/api";
import { fromBase64 } from "@/lib/utils/encoding";
import type { APIRoute } from "astro";
import { sql } from "bun";

export const GET: APIRoute = async (ctx) => {
  const { id } = ctx.params;
  if (!id) {
    return JSONResponse({ error: "Item ID required" }, 400);
  }

  try {
    const [row] = await sql`
      SELECT s.img_data
      FROM shop.items s
      WHERE s.id = ${id}
    `;
    if (!row || !row.img_data) return JSONResponse({ error: "Not found" }, 404);

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
    console.error(error);
    return JSONResponse({ error: "Internal Server Error" }, 500);
  }
};
