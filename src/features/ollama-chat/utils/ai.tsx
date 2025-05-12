import { createMutation } from "@/lib/solidjs/mutation";
import { Ollama } from "ollama";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { Base64Image } from "../components/ImageSelectBtn";
import { db, type Chat } from "./db";
import { CHAT_TITLE_GENERATOR } from "./prompt";
import { generateWebSearchQuery, websearch } from "./websearch";

export const createChatTitleMutation = (chat: Chat) =>
  createMutation({
    onBefore: async () => {
      return {
        ollama: new Ollama({ host: chat.config.url }),
      };
    },
    mutation: async (_, ctx) => {
      // get last 5 messages
      const history = (
        await db.chatMessages
          .where({ chatId: chat.id })
          .reverse()
          .limit(6)
          .toArray()
      ).reverse();

      // case no messages
      if (history.length === 0) {
        // Setze "Leerer Chat" als Titel
        await db.chats.update(chat.id, { name: "Leerer Chat" });
        return "Leerer Chat";
      }

      // join the content of the last 5 messages
      const lastNMessages = history
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n");

      // get the prompt
      const prompt = CHAT_TITLE_GENERATOR.replace(
        "{{chat_history}}",
        lastNMessages,
      );

      // define return schema
      const schema = z.object({
        title: z.string().nonempty().max(100),
        description: z.string().optional(),
      });

      // generate the new chat name
      const { response } = await ctx.ollama.generate({
        model: chat.config.meta_model ?? chat.config.model ?? "",
        prompt,
        stream: false,
        format: zodToJsonSchema(schema),
      });

      // parse the response
      const parsedResponse = schema.parse(JSON.parse(response));

      // set new chat name to the database
      await db.chats.update(chat.id, { name: parsedResponse.title });

      return parsedResponse.title;
    },
    onError: async (error) => {
      console.error("Error while creating title:", error);
    },
  });

export const createChatcompletionMutation = (chat: Chat) =>
  createMutation({
    // create context for the mutation (only runs once even if the mutation is retried)
    onBefore: async ({
      message,
      images,
      done,
    }: {
      message: string;
      images?: Base64Image[];
      done: () => void;
    }) => {
      // create user send message here to avoid recreating it in the mutation if it is retried
      await db.chatMessages.add({
        chatId: chat.id,
        role: "user",
        content: message,
        timestamp: Date.now(),
        images: images?.map((image) => image.base64) ?? undefined,
        image_names: images?.map((image) => image.name) ?? undefined,
      });

      return {
        // create new ollama instance
        ollama: new Ollama({ host: chat.config.url }),

        // create a slot in the context to store the message id of the new message
        // this is used do delete the message if the mutation is aborted or errors out
        newMessageId: null as number | null,

        // add done function to the context to focus the input field after sending the message
        done,
      };
    },
    mutation: async (_, ctx) => {
      // step 0: preload model if specified in the chat config
      if (chat.config.preload_model) {
        await ctx.ollama.chat({
          model: chat.config.model ?? "",
        });
      }

      // step 1: get the message history for this chat (which includes the message with the user question)
      const messages = (
        await db.chatMessages
          .where({ chatId: chat.id })
          .reverse()
          .limit((chat.config.retention ?? 100) + 1)
          .toArray()
      )
        .reverse()
        .map((m) => ({
          role: m.role,
          content: m.content,
          images: m.images,
        }));

      // step 2: create a new message in the db where the data is beeing streamed into
      const newMessageId = await db.chatMessages.add({
        chatId: chat.id,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
      });
      // set the new message id in the context
      ctx.newMessageId = newMessageId;

      // step 3: do websearch if enabled
      if (chat.websearch.enabled) {
        // get the user prompt
        const userPrompt = messages[messages.length - 1].content;

        // update message in db to show that the websearch is pending
        db.chatMessages.update(newMessageId, {
          websearch: { status: "pending" },
        });

        // generate the search query
        const searchQuery = await generateWebSearchQuery(
          userPrompt,
          chat,
          messages.slice(-1).map((m) => m.content),
        );
        db.chatMessages.update(newMessageId, {
          websearch: { status: "pending", search_query: searchQuery },
        });

        // do the websearch
        const searchRes = await websearch(searchQuery, chat);

        // store the search results in the db
        db.chatMessages.update(newMessageId, {
          websearch: {
            status: "done",
            search_query: searchQuery,
            results: searchRes.results,
            search_duration: searchRes.elapsed_time,
          },
        });

        // assable the websearch prompt
        const resultsString = searchRes.results
          .map(
            (res) =>
              `
          SOURCE: ${res.source}
          TITLE: ${res.title}
          CONTENT:
          ${res.content}
          `,
          )
          .join("---");

        if (!chat.websearch.prompt) {
          throw new Error("Es muss ein Websearch Prompt definiert sein");
        }

        const webSearchPrompt = chat.websearch.prompt
          .replace("{{user_input}}", userPrompt)
          .replace("{{search_results}}", resultsString);

        // replace the content of the last message with the websearch prompt
        // NOTE: this only injects the prompt into the last message in memory, not in the db.
        // that way the user can still see the original message and all the websearch results
        // are not part of the chat history
        messages[messages.length - 1].content = webSearchPrompt;
      }

      // step 4: send messages to ollama
      const response = await ctx.ollama.chat({
        model: chat.config.model ?? "",
        messages: messages,
        stream: true,
      });

      // step 5: update message content in db
      let content = "";
      for await (const part of response) {
        if (ctx.abortSignal.aborted) {
          break;
        }
        content += part.message.content;
        await db.chatMessages.update(newMessageId, {
          content,
          done: part.done,
          meta: {
            model: part?.model,
            total_duration: part?.total_duration,
            prompt_eval_count: part?.prompt_eval_count,
            prompt_eval_duration: part?.prompt_eval_duration,
            eval_count: part?.eval_count,
            eval_duration: part?.eval_duration,
          },
        });
      }
    },
    onSuccess: async () => {
      db.chats.update(chat.id, { latestMessageDate: Date.now() });
    },
    onFinally: async (ctx) => {
      // call done function to focus the input field
      ctx?.done();
    },
    onError: async (_, ctx) => {
      // if there was an error, delete the message
      if (ctx?.newMessageId) {
        await db.chatMessages.delete(ctx.newMessageId);
      }
      console.error("Error sending message");
    },
    onAbort: async (ctx) => {
      // if the mutation was aborted, delete the message
      if (ctx?.newMessageId) {
        await db.chatMessages.delete(ctx.newMessageId);
      }
      console.log("Sending message aborted");
    },
  });
