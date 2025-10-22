import createModal from "@/components/solidjs/Modal";
import Tooltip from "@/components/solidjs/Tooltip";
import convert from "convert";
import { Ollama, type ModelResponse } from "ollama/browser";
import { createResource, For, Show } from "solid-js";
import {
  db,
  deleteChat,
  duplicateChat,
  useChatQueryParam,
  type Chat,
} from "../utils/db";
import { createChatTitleMutation } from "../utils/ai";
import { createMutation } from "@/lib/solidjs/mutation";
import Switch from "@/components/solidjs/Switch";

/**
 * This function fetches the models from the Ollama server
 * @param url the url of the Ollama server
 * @returns an object containing the models and an error if there was one
 */
export async function fetchModels(url: string | undefined) {
  if (!url) return { models: [] };

  try {
    const ollama = new Ollama({ host: url });
    return { ...(await ollama.list()), error: null };
  } catch (error) {
    return { models: [], error };
  }
}

export const ModelDropdown = ({
  models,
  value,
  onChange,
  error,
}: {
  error?: string;
  models: ModelResponse[];
  value?: string;
  onChange?: (model: string) => void;
}) => {
  return (
    <div class="flex flex-col gap-1">
      <div class="relative w-full">
        <div class="absolute inset-y-0 left-3 flex items-center text-gray-500">
          <i class="ti ti-robot" />
        </div>
        <select
          class={`input-simple w-full cursor-pointer p-2 pl-9 ${
            error ? "outline-1 outline-red-500" : "outline-0"
          } `}
          value={models.findIndex((m) => m.name === value)}
          onChange={(e) => {
            const model = models[+e.currentTarget.value];
            onChange?.(model?.name);
          }}
        >
          <For each={models.sort((a, b) => a.name.localeCompare(b.name))}>
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
      <Show when={error}>
        <p class="text-xs text-red-500">{error}</p>
      </Show>
    </div>
  );
};

export default function useEditChatModal(chat: Chat) {
  const { open, openModal, closeModal, Modal } = createModal(
    "Chat Einstellungen",
    false,
  );

  const { mutate: generateTitle, loading: generateTitleIsLoading } =
    createChatTitleMutation(chat);

  const { mutate: duplicateChatMutation, loading: duplicateChatIsLoading } =
    createMutation({
      mutation: async (duplicateMessages: boolean) => {
        const newChatId = await duplicateChat(chat!.id, duplicateMessages);
        setChatParam(newChatId!);
      },
      onSuccess: () => {
        closeModal();
      },
    });

  const [response] = createResource(() => chat?.config.url, fetchModels);

  const [_, setChatParam] = useChatQueryParam();

  const Button = () => (
    <button
      onClick={openModal}
      class="icon-btn"
      aria-label={`Chat Einstellungen ${open() ? "schließen" : "öffnen"}`}
    >
      <i class={`ti ${open() ? "ti-adjustments-off" : "ti-adjustments"}`} />
    </button>
  );

  const EditModal = () => (
    <Modal>
      <div class="flex max-w-[500px] min-w-[30vw] flex-col gap-4 md:max-w-[700px] lg:max-w-[1000px]">
        <h5>Allgemeine Einstellungen</h5>

        <div class="paper p-2 text-xs text-green-500 ring-1 ring-green-500">
          Der Chatverlauf und alle weiteren Daten werden lokal in deinem Browser
          gespeichert. Es werden keine Daten an einen Server übermittelt
          (Websuche ausgenommen).
        </div>

        {/* Input field for Chat Name */}
        <div>
          <label for="chat-name-input">
            <p class="mb-1 block text-xs font-medium text-gray-500">
              Chat Name
            </p>
            <p class="mb-1 block text-xs text-gray-400">
              Es ist möglich per KI einen Namen für den Chat generieren zu
              lassen
            </p>
          </label>
          <div class="flex flex-row gap-1">
            <input
              id="chat-name-input"
              type="text"
              class="input-simple w-full"
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
                  generateTitle(_);
                }}
                aria-label="Chat Namen autogenerieren"
                class="icon-btn aspect-square h-full"
                disabled={generateTitleIsLoading()}
              >
                <i
                  class={`ti ${generateTitleIsLoading() ? "ti-loader animate-spin" : "ti-sparkles"} `}
                />
              </button>
            </Tooltip>
          </div>
        </div>

        <div>
          <label for="ollama-url-input">
            <p class="mb-1 block text-xs font-medium text-gray-500">
              Ollama Server
            </p>
            <p class="mb-1 block text-xs text-gray-400">
              Unter dieser URL ist dein Ollama Server erreichbar
            </p>
          </label>
          <div class="relative w-full">
            <div class="absolute inset-y-0 left-3 flex items-center text-gray-500">
              <i
                class={`ti ${response()?.error ? "ti-plug-connected-x text-red-500" : "ti-plug-connected text-green-500"}`}
              />
            </div>
            <input
              id="ollama-url-input"
              type="text"
              class="input-simple w-full p-2 pl-9"
              placeholder="Ollama URL"
              value={chat?.config.url || ""}
              onInput={(e) => {
                const value = e.currentTarget.value;
                db.chats.update(chat!.id, { "config.url": value });
              }}
            />
          </div>
        </div>

        <div>
          <label>
            <p class="mb-1 block text-xs font-medium text-gray-500">Modell</p>
            <p class="mb-1 block text-xs text-gray-400">
              Das Chat-Modell, das für die KI verwendet werden soll
            </p>
          </label>
          <Show
            when={response()?.models.length}
            fallback={
              <div class="paper p-2 text-xs text-red-500 ring-1 ring-red-500">
                Der Ollama Server konnte nicht erreicht werden. Bitte überprüfe
                die URL.
              </div>
            }
          >
            <ModelDropdown
              models={response()?.models || []}
              value={chat?.config.model}
              onChange={(model) => {
                db.chats.update(chat!.id, {
                  "config.model": model,
                });
              }}
            />
          </Show>
        </div>

        <h5 class="mt-2">KI-Finetuning</h5>

        {/* Input field for max message retention */}
        <div>
          <label for="chat-name-input">
            <p class="mb-1 block text-xs font-medium text-gray-500">
              Modelle automatisch laden
            </p>
            <p class="mb-1 block text-xs text-gray-400">
              Wenn möglich, wird das Chat-Modell automatisch geladen was zu
              einer schnelleren Antwortzeit führt.
            </p>
          </label>

          <Switch
            value={!!chat?.config.preload_model}
            onChange={(value) => {
              db.chats.update(chat!.id, { "config.preload_model": value });
            }}
          />
        </div>

        {/* Input field for max message retention */}
        <div>
          <label for="chat-name-input">
            <p class="mb-1 block text-xs font-medium text-gray-500">
              Retention
            </p>
            <p class="mb-1 block text-xs text-gray-400">
              Anzahl der letzten Nachrichten, die als Kontext für die KI
              verwendet werden sollen
            </p>
          </label>
          <input
            id="chat-name-input"
            type="number"
            class="input-simple w-full"
            placeholder="# Nachrichten"
            value={chat?.config.retention || 0}
            onInput={(e) => {
              const v = e.currentTarget.value;
              db.chats.update(chat!.id, { "config.retention": Number(v) });
            }}
          />
        </div>

        <div>
          <label>
            <p class="mb-1 block text-xs font-medium text-gray-500">
              Meta-Modell
            </p>
            <p class="mb-1 block text-xs text-gray-400">
              Dieses Modell wird für Hilfsfunktionen genutzt. Wenn kein Modell
              ausgewählt ist, wird das Chat-Modell verwendet. Besondern wenn ein
              sehr großes Modell als Chat-Modell verwendet wird, kann es
              sinnvoll sein, ein kleineres Modell als Meta-Modell zu verwenden.
              Das Meta-Modell wird standardmäßig für folgende Funktionen
              genutzt:
            </p>
            <ul class="mb-1 block list-inside list-disc text-xs text-gray-400">
              <li>Generierung des Chat Namen</li>
              <li>Generierung der Websuchanfrage</li>
            </ul>
          </label>
          <Show
            when={response()?.models.length}
            fallback={
              <div class="paper p-2 text-xs text-red-500 ring-1 ring-red-500">
                Der Ollama Server konnte nicht erreicht werden. Bitte überprüfe
                die URL.
              </div>
            }
          >
            <ModelDropdown
              models={response()?.models || []}
              value={chat?.config.meta_model}
              onChange={(model) => {
                db.chats.update(chat!.id, {
                  "config.meta_model": model,
                });
              }}
            />
          </Show>
        </div>

        {/* System Prompt */}
        <div>
          <label for="system-prompt-input">
            <p class="mb-1 block text-xs font-medium text-gray-500">
              System Prompt
            </p>
            <p class="mb-1 block text-xs text-gray-400">
              Gibt dem KI-Model Anweisungen zu Rolle, Verhalten und
              Antwortformat. Diese Anweisungen bleiben während der gesamten
              Konversation aktiv.
            </p>
          </label>
          <textarea
            id="system-prompt-input"
            class="input-simple w-full font-mono text-xs"
            placeholder="System Prompt"
            value={chat.config.system_prompt || ""}
            onInput={(e) => {
              const value = e.currentTarget.value;
              db.chats.update(chat!.id, { "config.system_prompt": value });
            }}
          />
        </div>

        <h5>Websuche</h5>

        <div class="paper -my-1 p-2 text-xs text-green-500 ring-1 ring-green-500">
          Die Websuche-Funktion übermittelt die Suchanfrage an eine
          Suchenmaschinene, wo die Suche durchgeführt wird. Aufgrund von CORS
          Beschränkungen ist es nicht möglich, die Suche direkt im Browser
          durchzuführen. Es wird empfohlen, die Websuche nur für nicht sensiblen
          Daten zu verwenden.
          <br />
          Die Suchenmaschinene basiert auf{" "}
          <a
            class="underline"
            target="_blank"
            href="https://search.valentin-kolb.blog"
          >
            SearchXNG
          </a>{" "}
          und speichert keine personenbezogenen Daten. Es wird in Zukunft auch
          möglich sein, das Backend selbst zu hosten.
        </div>

        {/* Websearch Prompt */}
        <div>
          <label for="websearch-prompt-input">
            <p class="mb-1 block text-xs font-medium text-gray-500">
              Websearch Prompt Template
            </p>
            <p class="mb-1 block text-xs text-gray-400">
              Dieser Prompt wird verwendet um der KI die Ergebnisse der
              Internet-Suche mitzuteilen. Das Template sollte die folgenden
              Platzhalter enthalten:
            </p>
            <ul class="mb-1 block list-inside list-disc font-mono text-xs text-gray-400">
              <li>{"{{user_input}}"}</li>
              <li>{"{{search_results}}"}</li>
            </ul>
          </label>
          <textarea
            id="websearch-prompt-input"
            class="input-simple w-full font-mono text-xs"
            placeholder="Websearch Prompt"
            value={chat?.websearch?.prompt || ""}
            onInput={(e) => {
              const value = e.currentTarget.value;
              db.chats.update(chat!.id, { "websearch.prompt": value });
            }}
          />
        </div>

        {/* Websearch Prompt */}
        <div>
          <label for="websearch-query-generator-input">
            <p class="mb-1 block text-xs font-medium text-gray-500">
              Suchanfrage Generator
            </p>
            <p class="mb-1 block text-xs text-gray-400">
              Dieser Prompt wird verwendet um den eigentlich Prompt in eine
              Websuche umzuwandeln. Das Template sollte die folgenden
              Platzhalter enthalten:
            </p>
            <ul class="mb-1 block list-inside list-disc font-mono text-xs text-gray-400">
              <li>{"{{datetime}}"}</li>
              <li>{"{{conversation_history}}"}</li>
            </ul>
          </label>
          <textarea
            id="websearch-query-generator-input"
            class="input-simple w-full font-mono text-xs"
            placeholder="Query Generator"
            value={chat?.websearch?.query_generator_prompt || ""}
            onInput={(e) => {
              const value = e.currentTarget.value;
              db.chats.update(chat!.id, {
                "websearch.query_generator_prompt": value,
              });
            }}
          />
        </div>

        <div>
          <label for="websearch-no-results-input">
            <p class="mb-1 block text-xs font-medium text-gray-500">
              Suchergebnisse
            </p>
            <p class="my-1 block text-xs text-gray-400">
              Maximale Anzahl an Suchergebnissen die an die KI übermittelt
              werden
            </p>
          </label>
          <input
            id="websearch-no-results-input"
            type="number"
            class="input-simple w-full"
            placeholder="# Suchergebnisse"
            value={chat?.websearch.no_results || 0}
            onInput={(e) => {
              const v = e.currentTarget.value;
              db.chats.update(chat!.id, {
                "websearch.no_results": Number(v),
              });
            }}
          />
        </div>

        <h5 class="mt-2">Aktionen</h5>

        <div class="paper p-2 text-xs text-green-500 ring-1 ring-green-500">
          Das <b>Löschen</b> eines Chats ist unwiderruflich. Es werden alle
          Nachrichten, Embeddings und Einstellungen gelöscht.
          <br />
          <b>Duplizieren:</b> Eine Kopie des Chats wird erstellt, die alle
          Embeddings und Einstellungen enthält, jedoch <b>keine</b> Nachrichten.
          <br />
          <b>Kopieren:</b> Eine Kopie des Chats wird erstellt, die alle
          Embeddings, Einstellungen <b>und Nachrichten</b> enthält
        </div>

        {/* buttons */}
        <div class="flex flex-row gap-1">
          <Tooltip label="Diese Aktion kann nicht rückgängig gemacht werden.">
            <button
              onClick={() => {
                deleteChat(chat!.id);
                setChatParam(null);
                closeModal();
              }}
              class="btn-simple flex items-center gap-2 text-sm"
            >
              <i class="ti ti-trash text-red-500" />
              Löschen
            </button>
          </Tooltip>

          <Tooltip label="Ein Duplikat wird erstellt, das alle Embeddings und Einstellungen enthält, aber keine Nachrichten.">
            <button
              onClick={() => {
                console.log("Duplicate Chat");
                duplicateChatMutation(false);
              }}
              class="btn-simple flex items-center gap-2 text-sm"
            >
              <i
                class={`ti text-green-500 ${duplicateChatIsLoading() ? "ti-loader animate-spin" : "ti-copy"}`}
              />
              Duplizieren
            </button>
          </Tooltip>

          <Tooltip label="Bei Kopieren wird ein neuer Chat erstellt, der alle Embeddings, Einstellungen und Nachrichten enthält.">
            <button
              onClick={() => {
                duplicateChatMutation(true);
              }}
              class="btn-simple flex items-center gap-2 text-sm"
            >
              <i
                class={`ti text-blue-500 ${duplicateChatIsLoading() ? "ti-loader animate-spin" : "ti-copy"}`}
              />
              Kopieren
            </button>
          </Tooltip>

          <button
            onClick={closeModal}
            class="btn-simple flex items-center gap-2 text-sm"
          >
            <i class="ti ti-check text-teal-500" />
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
