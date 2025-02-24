import useQueryParam from "@/lib/search-params";
import Dexie, { type EntityTable } from "dexie";
import type { Message } from "ollama/browser";

export type Chat = {
  id: number;
  name: string;
  latestMessageDate: number;
  config: {
    url?: string;
    model?: string;
    retention?: number;
  };
};

export type ChatMessage = Message & {
  id: number;
  chatId: number;
  done?: boolean;
  timestamp: number;
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
};

db.version(1).stores({
  chats: "++id, name, latestMessageDate",
  chatMessages: "++id, chatId, role, content, timestamp, done",
});

/** creates a new chat with default values */
const newChat = async () => {
  return await db.chats.add({
    name: "Neuer Chat",
    latestMessageDate: Date.now(),
    config: {
      url: "http://127.0.0.1:11434",
      retention: 30,
    },
  });
};

/** delete chat and all messages for that chat */
const deleteChat = (chatId: number) => {
  db.transaction("rw", db.chats, db.chatMessages, () => {
    db.chatMessages.where({ chatId }).delete();
    db.chats.delete(chatId);
  });
};

export { db, newChat, deleteChat };

const CHAT_ID = "chatId";
export const useChatQueryParam = () => useQueryParam(CHAT_ID, Number);
