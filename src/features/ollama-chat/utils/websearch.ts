/*

This Module provides a web-search functionality for the chatbot.
It uses SearXNG as a search engine and fetches the results from the server.

The following steps are taken to perform a search:

1. Generate a search query based on the user's input (with ollama).
2. Send the query to the search engine.
3. Fetch the fist N results from the search engine.
4. Parse the result pages

*/

import type {
  WebsearchAPIRequest,
  WebsearchAPIResponse,
  WebsearchAPIWebsiteResult,
} from "@/pages/api/websearch";
import { ofetch } from "ofetch";
import { Ollama } from "ollama/browser";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { Chat } from "./db";

export type WebsearchResult = {
  query: string;
  results: WebsearchAPIWebsiteResult[];
};

/**
 * This function uses ollama to generate a search query based on the user's input.
 * @param prompt the user's input
 * @param chat the current chat
 * @returns string the search query
 */
export const generateWebSearchQuery = async (
  prompt: string,
  chat: Chat,
  history: string[],
) => {
  const ollama = new Ollama({ host: chat.config.url ?? "" });

  // response schema
  const schema = z.object({ query: z.string() });

  // get current date time
  const datetime = new Date().toLocaleString();

  // check if the prompt is defined
  if (!chat.websearch.query_generator_prompt) {
    throw new Error("Es wurde kein Query Generator Prompt definiert.");
  }

  // get the last 5 messages
  const conversation_history = history.slice(-5).join("\n");

  // generate the search query
  const result = await ollama.generate({
    model: chat.config.meta_model ?? chat.config.model ?? "",
    prompt: prompt,
    system: chat.websearch.query_generator_prompt
      .replace("{{datetime}}", datetime)
      .replace("{{conversation_history}}", conversation_history),
    format: zodToJsonSchema(z.object({ query: z.string() })),
    stream: false,
  });

  // parse the response and return the query
  return schema.parse(JSON.parse(result.response)).query;
};

export const websearch = async (searchQuery: string, chat: Chat) => {
  const response = await ofetch<WebsearchAPIResponse>("/api/websearch", {
    method: "POST",
    timeout: 10000,
    body: {
      query: searchQuery,
      max_results: chat.websearch.no_results ?? 5,
    } as WebsearchAPIRequest,
  });

  if ("error" in response) {
    throw new Error(`Websearch failed: ${response.error}`);
  }

  return {
    results: response.results,
    elapsed_time: response.elapsed_time,
    results_count: response.results_count,
  };
};
