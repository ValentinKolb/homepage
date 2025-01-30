import {
  IconAdjustments,
  IconCommand,
  IconCornerDownLeft,
  IconLoader,
  IconPencilPlus,
  IconPlugConnected,
  IconPlus,
  IconRobot,
  IconSend,
  IconSettings,
  IconSlash,
  IconX,
} from "@tabler/icons-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import useSWR from "swr";
import { Ollama, type Message } from "ollama/browser";
import ChatsList from "./ChatsList";
import { db, useChatQueryParam } from "./db";
import { useLiveQuery } from "dexie-react-hooks";
import { Button } from "@/components/ui/button";
import Toolbar from "./Toolbar";

const OllamaChat = () => {
  const [chatParam, _] = useChatQueryParam();

  const chat = useLiveQuery(
    () => (chatParam ? db.chats.get(chatParam) : undefined),
    [chatParam],
  );

  console.log("chat", chat);

  /*
  const queryFunction =
    data && selectedModel
      ? async (
          query: string,
          config?: { messages?: Message[]; format?: string },
        ) => {
          const response = await data?.ollama.chat({
            model: selectedModel!.name,
            messages: [
              { role: "user", content: query },
              ...(config?.messages || []),
            ],
            format: config?.format,
            stream: true,
          });
          return response;
        }
      : null;
  */

  return (
    <div className="flex flex-row bg-gray-100 gap-1 p-1 flex-1 overflow-hidden">
      <ChatsList />

      {chat && (
        <div className="flex-1 bg-white rounded-lg p-1">
          {/* Toolbar */}
          <Toolbar chat={chat} />
        </div>
      )}
    </div>
  );
};

export default OllamaChat;
