import { useLiveQuery } from "dexie-react-hooks";
import React from "react";
import { db, useChatQueryParam } from "./db";

export default function ChatsList() {
  const chats = useLiveQuery(() => db.chats.toArray()); // todo sort by latest chat

  const [chatParam, setChatParam] = useChatQueryParam();

  return (
    <div className="overflow-y-auto scrollbar-none space-y-1">
      <ul className="space-y-1">
        {chats?.map((chat) => (
          <li
            key={chat.id}
            className={`bg-white rounded-lg border-0 p-4 text-sm
              text-gray-500 hover:shadow-sm hover:text-gray-700 cursor-pointer
              ${chat.id === chatParam ? "shadow-sm text-gray-700 font-bold" : ""}
              `}
            onClick={() => setChatParam(chat.id)}
          >
            {chat.name}({chat.id})
          </li>
        ))}
      </ul>
    </div>
  );
}
