import createModal from "@/components/ui/Modal";
import Tooltip from "@/components/ui/Tooltip";
import convert from "convert";
import { Ollama } from "ollama";
import { createResource, For, Show } from "solid-js";
import { db, deleteChat, useChatQueryParam, type Chat } from "./db";

/**
 * This function fetches the models from the Ollama server
 * @param url the url of the Ollama server
 * @returns an object containing the models and an error if there was one
 */
async function fetchModels(url: string | undefined) {
  if (!url) return { models: [] };

  try {
    const ollama = new Ollama({ host: url });
    return { ...(await ollama.list()), error: null };
  } catch (error) {
    return { models: [], error };
  }
}

export default function useEditChatModal(chat: Chat) {
  const { open, openModal, closeModal, Modal } =
    createModal("Chat Einstellungen");

  const [response, { refetch }] = createResource(
    () => chat?.config.url,
    fetchModels,
  );

  const [_, setChatParam] = useChatQueryParam();

  const Button = () => (
    <button
      onClick={openModal}
      class="h-8 w-8 rounded-lg border-0 bg-white text-gray-500 shadow-md hover:text-gray-700 focus:ring-0"
      aria-label={`Chat Einstellungen ${open() ? "schließen" : "öffnen"}`}
    >
      <i class={`ti ${open() ? "ti-adjustments-off" : "ti-adjustments"}`} />
    </button>
  );

  const EditModal = () => (
    <Modal>
      <div class="flex min-w-[30vw] flex-col gap-4">
        <h5>Allgemein</h5>

        {/* Input field for Chat Name */}
        <div>
          <label
            for="chat-name-input"
            class="mb-1 block text-xs font-medium text-gray-500"
          >
            Chat Name
          </label>
          <div class="flex flex-row gap-1">
            <input
              id="chat-name-input"
              type="text"
              class="no-focus w-full rounded-lg border-0 border-gray-300 p-2 text-sm text-gray-500 shadow-md focus:border-blue-500 focus:ring focus:ring-blue-200"
              placeholder="Chat Name"
              value={chat?.name || ""}
              onInput={(e) => {
                const newName = e.currentTarget.value;
                db.chats.update(chat!.id, { name: newName });
              }}
            />

            <Tooltip label="Chat Namen autogenerieren">
              <button
                onClick={() => {
                  alert("Nicht implentiert");
                }}
                aria-label="Chat Namen autogenerieren"
                class="group flex h-full items-center justify-center rounded-lg p-2 text-sm text-gray-500 shadow-lg hover:text-gray-700"
              >
                <i class="ti ti-bulb group-hover:ti-bulb-filled text-orange-500" />
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Input field for max message retention */}
        <div>
          <label for="chat-name-input">
            <p class="mb-1 block text-xs font-medium text-gray-500">
              Retention
            </p>
            <p class="mb-1 block max-w-[500px] text-xs text-gray-400">
              Anzahl der letzten Nachrichten, die als Kontext für die KI
              verwendet werden sollen
            </p>
          </label>
          <input
            id="chat-name-input"
            type="number"
            class="no-focus w-full rounded-lg border-0 border-gray-300 p-2 text-sm text-gray-500 shadow-md focus:border-blue-500 focus:ring focus:ring-blue-200"
            placeholder="# Nachrichten"
            value={chat?.config.retention || 0}
            onInput={(e) => {
              const v = e.currentTarget.value;
              db.chats.update(chat!.id, { "config.retention": Number(v) });
            }}
          />
        </div>

        <h5 class="mt-2">Ollama Server</h5>

        <div>
          <label
            for="chat-name-input"
            class="mb-1 block text-xs font-medium text-gray-500"
          >
            Server URL
          </label>
          <div class="relative w-full">
            <div class="absolute inset-y-0 left-3 flex items-center text-gray-500">
              <i
                class={`ti ${response()?.error ? "ti-plug-connected-x text-red-500" : "ti-plug-connected text-green-500"}`}
              />
            </div>
            <input
              type="text"
              class="no-focus w-full rounded-lg border-0 p-2 pl-9 text-sm text-gray-500 shadow-md focus:text-gray-700"
              placeholder="Ollama URL"
              value={chat?.config.url || ""}
              onInput={(e) => {
                const value = e.currentTarget.value;
                db.chats.update(chat!.id, { "config.url": value });
              }}
            />
          </div>
        </div>

        <Show when={response()?.models.length}>
          <div>
            <label
              for="chat-name-input"
              class="mb-1 block text-xs font-medium text-gray-500"
            >
              Modell
            </label>
            <div class="flex flex-row gap-1">
              <div class="relative w-full">
                <div class="absolute inset-y-0 left-3 flex items-center text-gray-500">
                  <i class="ti ti-robot" />
                </div>
                <select
                  class={`w-full cursor-pointer rounded-lg bg-white p-2 pl-9 text-sm text-gray-500 shadow-md hover:text-gray-700 focus:ring-0 ${
                    !chat.config.model ||
                    response()?.models.findIndex(
                      (model) => model.name === chat?.config.model,
                    ) === -1
                      ? "outline outline-1 outline-red-500"
                      : "outline-0"
                  } `}
                  value={response()?.models.findIndex(
                    (model) => model.name === chat?.config.model,
                  )}
                  onChange={(e) => {
                    const model = response()?.models[+e.currentTarget.value];
                    db.chats.update(chat!.id, { "config.model": model?.name });
                  }}
                >
                  <For
                    each={response()?.models.sort((a, b) =>
                      a.name.localeCompare(b.name),
                    )}
                  >
                    {(option, index) => {
                      const size = convert(option.size, "bytes").to("best");

                      return (
                        <option value={index()}>
                          {option.name} - ({option.details.parameter_size},{" "}
                          {Math.round(size.quantity)}
                          {size.unit})
                        </option>
                      );
                    }}
                  </For>
                </select>
              </div>

              <Tooltip label="Neu laden">
                <button
                  onClick={() => refetch()}
                  aria-label="Modelle neu laden"
                  class="flex h-full items-center justify-center rounded-lg p-2 text-sm text-gray-500 shadow-lg hover:text-gray-700"
                >
                  <i class="ti ti-reload" />
                </button>
              </Tooltip>
            </div>
          </div>
        </Show>

        <h5 class="mt-2">Aktionen</h5>

        {/* buttons */}
        <div class="flex flex-row gap-1">
          <button
            onClick={() => {
              deleteChat(chat!.id);
              setChatParam(null);
              closeModal();
            }}
            class="group flex items-center gap-2 rounded-lg p-2 text-sm text-gray-500 shadow-lg hover:bg-red-500 hover:text-white"
          >
            <i class="ti ti-trash text-red-500 group-hover:text-white" />
            Löschen
          </button>

          <button
            onClick={() => {
              alert("Noch nicht Implentiert");
            }}
            class="group flex items-center gap-2 rounded-lg p-2 text-sm text-gray-500 shadow-lg hover:text-gray-700"
          >
            <i class="ti ti-copy text-blue-500 group-hover:text-blue-700" />
            Duplizieren
          </button>

          <button
            onClick={closeModal}
            class="group flex items-center gap-2 rounded-lg p-2 text-sm text-gray-500 shadow-lg hover:text-gray-700"
          >
            <i class="ti ti-check text-teal-500 group-hover:text-teal-700" />
            OK
          </button>
        </div>
      </div>
    </Modal>
  );

  return {
    ToggleEditModalButton: Button,
    EditModal,
    openEditModal: openModal,
  };
}
