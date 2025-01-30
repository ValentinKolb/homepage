import {
  IconAdjustments,
  IconLoader,
  IconPencilPlus,
  IconPlugConnected,
  IconRobot,
  IconSlash,
  IconX,
} from "@tabler/icons-react";
import { Ollama } from "ollama/browser";
import React from "react";
import useSWR from "swr";
import { db, useChatQueryParam, type Chat } from "./db";

export default function Toolbar({ chat }: { chat: Chat }) {
  const { data, error, isLoading } = useSWR(`${chat.url}-models`, async () => {
    if (!chat.url) return;
    const ollama = new Ollama({ host: chat.url });
    const data = await ollama.list();
    return {
      ollama,
      models: data.models,
    };
  });

  const [_, setChatParam] = useChatQueryParam();

  console.log("chat", chat.id);

  const addChat = async () => {
    const newChat = await db.chats.add({
      name: "Neuer Chat",
      url: "http://127.0.0.1:11434",
    });
    setChatParam(newChat);
  };

  return (
    <div className="flex flex-row gap-2 justify-between items-center">
      <button
        onClick={addChat}
        className="h-8 w-8 p-2 rounded-lg border-0 text-gray-500 focus:ring-0 shadow-md hover:text-gray-700 bg-white"
      >
        <IconPencilPlus size={16} />
      </button>

      <div className="flex flex-row gap-2 items-center">
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center text-gray-500">
            {error ? (
              <IconX size={16} color="red" />
            ) : isLoading ? (
              <IconLoader size={16} className="animate-spin" />
            ) : (
              <IconPlugConnected size={16} color="green" />
            )}
          </div>
          <input
            type="text"
            className="h-8 text-sm p-2 pl-9 rounded-lg border-0 text-gray-500 no-focus shadow-md focus:text-gray-700"
            placeholder="Ollama URL"
            value={chat.url || ""}
            onChange={(e) => {
              const value = e.target.value;
              console.log(chat, value);
              db.chats.update(chat.id, { url: value });
            }}
          />
        </div>

        {data?.models && (
          <>
            <IconSlash />
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center text-gray-500">
                <IconRobot size={16} />
              </div>

              <select
                className=" h-8 text-sm p-2 pl-9 rounded-lg border-0 text-gray-500 hover:text-gray-700 cursor-pointer focus:ring-0 inset-shadow-md bg-white bg-none"
                value={chat.model}
                onChange={(e) => {
                  const model =
                    data?.models[e.target.value as unknown as number];
                  db.chats.update(chat.id, { model: model.name });
                }}
              >
                {data?.models.map((option, index) => (
                  <option key={index} value={index}>
                    {option.name} - {option.details.parameter_size}
                  </option>
                ))}
              </select>
            </div>
            <button className="h-8 w-8 p-2 rounded-lg border-0 text-gray-500 focus:ring-0 inset-shadow-md hover:text-gray-700">
              <IconAdjustments size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
