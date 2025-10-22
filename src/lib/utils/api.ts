import type { ActionError, ActionErrorCode } from "astro:actions";
import z from "zod";

export type Pagination = {
  perPage: number;
  page: number;
  offset: number;
};

export const JSONResponse = <T>(
  data: T,
  status: number = 200,
  headers: HeadersInit = {},
) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
};

export const parsePagination = (
  req: Request,
  defaultValue: Omit<Pagination, "offset">,
): Pagination => {
  const url = new URL(req.url);
  const page =
    parseInt(url.searchParams.get("page") || "", 10) || defaultValue.page;
  const perPage =
    parseInt(url.searchParams.get("perPage") || "", 10) || defaultValue.perPage;
  const offset = (page - 1) * perPage;
  return { page, perPage, offset };
};

export const parseRequest = async <T extends z.ZodTypeAny>(
  request: Request,
  schema: T,
): Promise<[z.infer<T>, null] | [null, Response]> => {
  const parsed = schema.safeParse(await request.json());

  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `${issue.message} at ${issue.path.join(".")}`)
      .join(", ");
    return [null, JSONResponse({ error: message }, 400)];
  }

  return [parsed.data, null];
};

/**
 * Filters out undefined values from an object
 * Prevents NULL values from being inserted/updated in database columns.
 *
 * @param obj - The object containing key-value pairs for SQL operations
 * @returns object with undefined values removed
 *
 * @example
 * // Basic usage with UPDATE
 * await sql`
 *   UPDATE users
 *   SET ${sql(definded({
 *     name: "Marry",       // included
 *     email: undefined,    // filtered out
 *     age: 30              // included
 *   }))}
 *   WHERE id = ${userId}
 * `
 */
export const defined = <T extends Record<string, any>>(obj: T) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== undefined),
  );
};

/**
 * Creates a redirect response to the error page with optional parameters
 *
 * @param config - Configuration object with error details
 * @param config.code - Error code (e.g., "UNAUTHORIZED", "NOT_FOUND", default: "UNKNOWN")
 * @param config.label - Optional error label
 * @param config.description - Optional error description
 * @param config.redirectUrl - Optional URL to redirect back to
 * @param config.redirectLabel - Optional label for redirect button (default: "OK")
 */
export const ErrorPage = (config: {
  code?: ActionErrorCode | "UNKNOWN";
  label?: string;
  description?: string;
  redirectUrl?: string;
  redirectLabel?: string;
  error?: ActionError;
}): Response => {
  const params = new URLSearchParams({
    code: config.code ?? config.error?.code ?? "UNKNOWN",
  });
  if (config.label) params.set("label", config.label);
  if (config.description) params.set("description", config.description);
  if (config.redirectUrl) params.set("redirectUrl", config.redirectUrl);
  if (config.redirectLabel) params.set("redirectLabel", config.redirectLabel);

  if (import.meta.env.DEV) {
    console.error("ErrorPage", config);
    config.error && console.log(config.error);
  }

  return new Response(null, {
    status: 303,
    headers: {
      Location: `/error?${params}`,
    },
  });
};
