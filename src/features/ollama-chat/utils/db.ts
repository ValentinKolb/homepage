import useQueryParam from "@/lib/solidjs/search-params";
import Dexie, { type EntityTable } from "dexie";
import type { Message } from "ollama/browser";
import {
  SEARCH_QUERY_GENERATOR_SYSTEM_PROMPT,
  SYSTEM_PROMPT,
  WEBSEARCH_PROMPT_TEMPLATE,
} from "./prompt";
import type { WebsearchAPIWebsiteResult } from "@/pages/api/websearch";

export type Chat = {
  id: number;
  name: string;
  latestMessageDate: number;
  config: {
    url?: string;
    model?: string;
    meta_model?: string;
    embedding_model?: string;
    retention?: number;
    system_prompt?: string;
    preload_model?: boolean;
  };
  websearch: {
    enabled: boolean;
    no_results?: number;
    prompt?: string;
    query_generator_prompt?: string;
  };
};

export type Embeddings = {
  id: number;
  chatId: number;
  filename: string;
  content: string;
  embeddings: number[];
  timestamp: number;
};

export type ChatMessage = Message & {
  id: number;
  chatId: number;
  done?: boolean;
  timestamp: number;
  image_names?: string[];
  websearch?: {
    status?: "pending" | "done";
    search_duration?: number;
    search_query?: string;
    results?: WebsearchAPIWebsiteResult[];
  };
  meta?: {
    model?: string;
    total_duration?: number;
    prompt_eval_count?: number;
    prompt_eval_duration?: number;
    eval_count?: number;
    eval_duration?: number;
  };
};

const db = new Dexie("OllamaChat") as Dexie & {
  chats: EntityTable<Chat, "id">;
  chatMessages: EntityTable<ChatMessage, "id">;
  embeddings: EntityTable<Embeddings, "id">;
};

db.version(1).stores({
  chats: "++id, name, latestMessageDate",
  chatMessages: "++id, chatId, role, content, timestamp, done",
  embeddings: "++id, chatId, filename, content, embeddings, timestamp",
});

/** creates a new chat with default values */
const newChat = async () => {
  return await db.chats.add({
    name: "Neuer Chat",
    latestMessageDate: Date.now(),
    config: {
      url: "http://127.0.0.1:11434",
      retention: 30,
      system_prompt: SYSTEM_PROMPT,
      model: undefined,
      embedding_model: undefined,
      preload_model: true,
    },
    websearch: {
      enabled: false,
      no_results: 5,
      prompt: WEBSEARCH_PROMPT_TEMPLATE,
      query_generator_prompt: SEARCH_QUERY_GENERATOR_SYSTEM_PROMPT,
    },
  });
};

/**
 * duplicate chat and all embedings for that chat
 * @param chatId the id of the chat to be duplicated
 * @param duplicateMessages if true, also duplicate all messages
 * @returns number the id of the new chat
 */
export const duplicateChat = async (
  chatId: number,
  duplicateMessages?: boolean,
) =>
  await db.transaction(
    "rw",
    db.chats,
    db.chatMessages,
    db.embeddings,
    async () => {
      // get chat
      const chat = await db.chats.get(chatId);
      if (!chat) return;

      // duplicate chat
      const newChatId = await db.chats.add({
        ...chat,
        id: undefined,
        name: "(Kopie) " + chat.name,
        latestMessageDate: Date.now(), // Update timestamp to current time
      });

      // get all embeddings for the old chat
      const embeddings = await db.embeddings.where({ chatId }).toArray();

      // add all embeddings in parallel to the new chat
      await Promise.all(
        embeddings.map((embedding) =>
          db.embeddings.add({ ...embedding, id: undefined, chatId: newChatId }),
        ),
      );

      // check if messages should be duplicated
      if (!duplicateMessages) return newChatId;

      // get all messages for the old chat
      const messages = await db.chatMessages.where({ chatId }).toArray();

      // add all messages in parallel to the new chat
      await Promise.all(
        messages.map((message) =>
          db.chatMessages.add({ ...message, id: undefined, chatId: newChatId }),
        ),
      );

      return newChatId;
    },
  );

/** delete chat and all messages for that chat */
const deleteChat = (chatId: number) => {
  db.transaction("rw", db.chats, db.chatMessages, () => {
    db.chatMessages.where({ chatId }).delete();
    db.chats.delete(chatId);
  });
};

export { db, deleteChat, newChat };

const CHAT_ID = "chatId";
export const useChatQueryParam = () => useQueryParam(CHAT_ID, Number);
