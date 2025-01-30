import useQueryParam from "@/lib/search-params";
import Dexie, { type EntityTable } from "dexie";
import type { Message } from "ollama/browser";

export type Chat = {
  id: number;
  name: string;
  url?: string;
  model?: string;
};

export type ChatMessage = Message & {
  id: number;
  chatId: number;
};

const db = new Dexie("OllamaChat") as Dexie & {
  chats: EntityTable<Chat, "id">;
  chatMessages: EntityTable<ChatMessage, "id">;
};

db.version(1).stores({
  chats: "++id, name",
  chatMessages: "++id, role, content",
});

export { db };

const CHAT_ID = "chatId";
export const useChatQueryParam = () => useQueryParam(CHAT_ID, Number);
