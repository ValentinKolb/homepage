import {
  IconAdjustments,
  IconCommand,
  IconCornerDownLeft,
  IconLoader,
  IconPlugConnected,
  IconPlus,
  IconRobot,
  IconSend,
  IconSettings,
  IconSlash,
  IconX,
} from "@tabler/icons-react";
import React, { useEffect, useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import useSWR from "swr";
import { Ollama, type Message } from "ollama/browser";

const OllamaSettings = () => {
  const [url, setUrl] = useState("http://127.0.0.1:11434");

  const { data, error, isLoading } = useSWR(`${url}-models`, async () => {
    const ollama = new Ollama({ host: url });
    const data = await ollama.list();
    return {
      ollama,
      models: data.models,
    };
  });
  const [selectedModel, setSelectedModel] = useState(data?.models[0]);

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

  return (
    <div className="flex flex-row gap-2 justify-end items-center">
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
          className="text-sm p-2 pl-9 rounded-lg border-0 text-gray-500 focus:ring-0 shadow-md focus:text-gray-700"
          placeholder="Ollama URL"
          value={url}
          onChange={(e) => {
            const value = e.target.value;
            setUrl(value);
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
              className="text-sm p-2 pl-9 rounded-lg border-0 text-gray-500 focus:ring-0 shadow-md bg-none"
              onChange={(e) => {
                setSelectedModel(
                  data.models[e.target.value as unknown as number],
                );
              }}
            >
              {data.models.map((option, index) => (
                <option key={index} value={index}>
                  {option.name} - {option.details.parameter_size}
                </option>
              ))}
            </select>
          </div>

          <button className="p-2 rounded-lg border-0 text-gray-500 focus:ring-0 shadow-md hover:text-gray-700">
            <IconAdjustments size={16} />
          </button>
        </>
      )}
    </div>
  );
};

export default function OllamaChat() {
  const [messages, setMessages] = useState([
    { text: "Hallo! Wie kann ich helfen?", sender: "bot" },
  ]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef(null);

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages([...messages, { text: input, sender: "user" }]);
    setInput("");
    // Simulierte Antwort
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { text: "Interessant! Erzähl mir mehr.", sender: "bot" },
      ]);
    }, 1000);
  };

  useEffect(() => {
    // chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex w-full bg-gray-100 p-1 flex-1 overflow-hidden">
      <div className="w-full rounded-lg bg-white shadow-xl p-4 flex flex-col h-[85vh]">
        <OllamaSettings />
        <div className="flex-1 overflow-y-auto space-y-2 p-2">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`p-2 rounded-lg max-w-xs ${
                msg.sender === "user"
                  ? "bg-blue-500 text-white self-end"
                  : "bg-gray-200 text-black self-start"
              }`}
            >
              {msg.text}
            </div>
          ))}
          <div ref={chatEndRef}></div>
        </div>
        <div className="flex items-center gap-2 p-2 border-t">
          <TextareaAutosize
            maxRows={6}
            className="resize-none w-full p-0 bg-transparent border-0 text-gray-800 focus:ring-0"
            placeholder="Schreib eine Nachricht..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && e.metaKey && sendMessage()}
          />
          <div className="has-tooltip">
            <div className="tooltip">
              <div className="flex flex-row">
                <IconCommand size={16} className="inline-block mr-1" />
                <IconPlus size={16} className="inline-block mr-1" />
                <IconCornerDownLeft size={16} className="inline-block mr-1" />
              </div>
            </div>
            <button
              className={`p-2 bg-gray-100 rounded-xl hover:shadow-md ${input.length === 0 && "cursor-not-allowed bg-gray-50 text-gray-400"}`}
              onClick={sendMessage}
            >
              <IconSend size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
