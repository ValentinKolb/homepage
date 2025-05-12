/*
This API endpoint is used to extract web content based on a search query.
It first searches using SearXNG to get relevant URLs, then extracts the
main content and title from those URLs.
*/

import type { APIRoute } from "astro";
import { z } from "zod";
import { ofetch } from "ofetch";
import { extractWebsiteContent } from "./_website-parser";

// set default values
const WEBSITE_TIMEOUT = 5000;
const SEARXNG_TIMEOUT = 10000;
const MAX_RESULTS = 10;
const DEFAULT_SEARXNG_URL = "https://search.valentin-kolb.blog";

// define types
const WebsearchRequestSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  max_results: z.number().int().positive().default(MAX_RESULTS),
});
type SearXNGResult = {
  url: string | undefined;
  title: string | undefined;
  content: string | undefined; // the search engine description
};

// interface types for the API
export type WebsearchAPIWebsiteResult = {
  source: string;
  title: string;
  content: string;
};
export type WebsearchAPIRequest = z.infer<typeof WebsearchRequestSchema>;
export type WebsearchAPIResponse =
  | {
      results_count: number;
      elapsed_time: number;
      results: WebsearchAPIWebsiteResult[];
    }
  | {
      error: string;
      details?: any;
    };

/**
 * The API Route for searching and extracting content
 */
export const POST: APIRoute = async ({ request }) => {
  const start_time = Date.now();

  try {
    // Parse JSON body from the request
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "Invalid JSON",
        } as WebsearchAPIResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Validate the request body with Zod
    const validationResult = WebsearchRequestSchema.safeParse(body);

    if (!validationResult.success) {
      // Return validation errors
      return new Response(
        JSON.stringify({
          error: "Validation error",
          details: validationResult.error.format(),
        } as WebsearchAPIResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Extract validated query and max_results from the parsed result
    const { query, max_results } = validationResult.data;

    // First, search for URLs using SearXNG
    const urls = await searchWithSearXNG(query, max_results);

    if (urls.length === 0) {
      return new Response(
        JSON.stringify({
          results_count: 0,
          elapsed_time: Date.now() - start_time,
          results: [],
        } as WebsearchAPIResponse),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Then, fetch and process all URLs in parallel
    const results = await fetchAllUrls(urls);

    return new Response(
      JSON.stringify({
        results_count: results.length,
        elapsed_time: Date.now() - start_time,
        results,
      } as WebsearchAPIResponse),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Failed to process request:", error);
    return new Response(
      JSON.stringify({ error: "Server error" } as WebsearchAPIResponse),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

/**
 * Builds and returns a search URL for the given search query and base URL.
 */
function buildSearchUrl(args: { baseUrl: string; searchQuery: string }) {
  let url;
  try {
    url = new URL(args.baseUrl.replace(/\/$/, "")); // remove trailing slash and path
  } catch (error) {
    throw new Error(`Invalid searXNG url: ${args.baseUrl}`);
  }
  // add the search path
  url.pathname += "/search";
  // add query params
  url.searchParams.set("q", encodeURIComponent(args.searchQuery));
  url.searchParams.set("format", "json");
  return url.toString();
}

/**
 * Search with SearXNG and return an array of URLs
 */
async function searchWithSearXNG(
  searchQuery: string,
  maxResults: number,
): Promise<string[]> {
  const searchUrl = buildSearchUrl({
    baseUrl: process.env.SEARXNG_URL ?? DEFAULT_SEARXNG_URL,
    searchQuery,
  });

  const searchResults = await ofetch<{
    results: SearXNGResult[];
  }>(searchUrl, {
    timeout: SEARXNG_TIMEOUT,
  });

  // Filter out undefined URLs and take only the required number
  return searchResults.results
    .filter((result) => result.url !== undefined)
    .slice(0, maxResults)
    .map((result) => result.url as string); // Type assertion is safe because we filtered undefined
}

/**
 * This function fetches a single URL and returns the html page
 */
async function fetchUrl(
  url: string,
): Promise<{ success: boolean; url: string; html?: string }> {
  try {
    const html = await ofetch(url, {
      timeout: WEBSITE_TIMEOUT,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Crawler/1.0)",
      },
    });
    return { success: true, url, html };
  } catch (error) {
    console.error(`Failed to fetch URL ${url}:`);
    return { success: false, url };
  }
}

/**
 * This function fetches all urls in parallel and returns the extracted content
 */
async function fetchAllUrls(
  urls: string[],
): Promise<WebsearchAPIWebsiteResult[]> {
  const results = await Promise.all(urls.map((url) => fetchUrl(url)));

  return results
    .filter((result) => result.success)
    .map((result) => {
      const { url, html } = result as { url: string; html: string };
      const { title, content } = extractWebsiteContent(html);
      const domain = new URL(url).hostname;
      return {
        source: url,
        title: title ?? domain,
        content,
      };
    });
}
