import Tooltip from "@/components/ui/Tooltip";
import { createClipboard } from "@/lib/solidjs/clipboard";
import { createLiveQuery } from "@/lib/solidjs/db-utils";
import convert from "convert";
import { createEffect, createSignal, For, Show, type JSX } from "solid-js";
import { db, type Chat, type ChatMessage } from "../utils/db";
import useEditChatModal from "./EditChatModal";
import { createChatcompletionMutation } from "../utils/ai";
import useBase64ImageSelect from "./ImageSelectBtn";
import MarkdownPreview from "@/components/ui/MarkdownPreview";
import useRAGSettings from "./RAGSettings";

// how many digits to show after the comma
const PRECISION = 1;

// generic container used for the message and websearch statistics
const Container = ({
  children,
  label,
}: {
  children: JSX.Element;
  label?: string;
}) => {
  const content = (
    <div class="flex flex-row items-center justify-center gap-1 border-0 font-mono text-[10px] text-gray-400">
      {children}
    </div>
  );

  return (
    <Show when={label} fallback={content}>
      <Tooltip label={label}>{content}</Tooltip>
    </Show>
  );
};

const AssistentMessageStatistics = ({ message }: { message: ChatMessage }) => {
  const promptTokensPerSecond = (
    ((message.meta?.prompt_eval_count ?? 0) * 1e9) /
    (message.meta?.prompt_eval_duration ?? 1)
  ).toFixed(PRECISION);

  const evalTokensPerSecond = (
    ((message.meta?.eval_count ?? 0) * 1e9) /
    (message.meta?.eval_duration ?? 1)
  ).toFixed(PRECISION);

  const { quantity, unit } = convert(
    message.meta?.total_duration ?? 0,
    "ns",
  ).to("best");

  const duration = `${quantity.toFixed(PRECISION)} ${unit}`;

  const { copy, wasCopied } = createClipboard();

  return (
    <div class="flex flex-row flex-wrap gap-x-4 gap-y-0">
      <Container label="Auswertungszeit">
        <i class="ti ti-clock" />
        {duration}
      </Container>
      <Container label="Auswertung des Prompts (Tokes/Sekunde)">
        <i class="ti ti-prompt" />
        {promptTokensPerSecond} t/s
      </Container>
      <Container label="Antwort generierung (Tokes/Sekunde)">
        <i class="ti ti-message" />
        {evalTokensPerSecond} t/s
      </Container>
      <Container label="KI-Modell">
        <i class="ti ti-robot" />
        {message.meta?.model}
      </Container>
      <Container label="Nachricht kopieren">
        <button
          class={`hover-text cursor-pointer font-bold`}
          onClick={() => copy(message.content)}
          aria-label="Nachricht kopieren"
        >
          <i
            class={`ti mr-1 cursor-pointer ${wasCopied() ? "ti-clipboard-check" : "ti-clipboard"}`}
          />
          {wasCopied() ? "Kopiert!" : "Kopieren"}
        </button>
      </Container>

      <Container label="Nachricht löschen">
        <div class="group">
          <i class={`ti ti-trash`} />

          <button
            class={`hover-text ml-1 hidden font-bold group-hover:inline`}
            onClick={() => db.chatMessages.delete(message.id)}
            aria-label="Nachricht Löschen"
          >
            Löschen
          </button>
        </div>
      </Container>
    </div>
  );
};

const UserMessageStatistics = ({ message }: { message: ChatMessage }) => {
  if (!message.image_names?.length) {
    return null;
  }

  return (
    <div class="flex flex-row flex-wrap gap-x-4 gap-y-0">
      <For each={message.image_names}>
        {(img) => (
          <Container label="Hochgeladenes Bild">
            <i class="ti ti-photo" />
            {img}
          </Container>
        )}
      </For>
    </div>
  );
};

const WebsearchStatistics = ({ message }: { message: ChatMessage }) => {
  const { quantity, unit } = convert(
    message.websearch?.search_duration ?? 0,
    "ms",
  ).to("best");

  const duration = `${quantity.toFixed(PRECISION)} ${unit}`;

  return (
    <div class="flex flex-row flex-wrap gap-x-4 gap-y-0">
      <Show when={message.websearch?.status === "pending"}>
        <Container label="Internet Suche">
          <i class="ti ti-loader animate-spin" />
          Suchen
          <Show when={message.websearch?.search_query}>
            {" "}
            nach '{message.websearch?.search_query}'
          </Show>
        </Container>
      </Show>

      <Show
        when={
          message.websearch?.search_duration !== undefined &&
          message.websearch?.search_duration > 0
        }
      >
        <Container label="Dauer Websuche">
          <i class="ti ti-timezone" />
          {duration}
        </Container>
      </Show>

      <Show when={message.websearch?.results}>
        <Container label={`Suche nach: '${message.websearch?.search_query}'`}>
          <i class="ti ti-world-search" />
          {message.websearch?.results?.length} Ergebnisse
        </Container>

        <For each={message.websearch?.results}>
          {(result) => (
            <a href={result.source} target="_blank" rel="noreferrer">
              <Container label={result.source}>
                <i class="ti ti-external-link" />
                <span class="hover:underline">{result.title}</span>
              </Container>
            </a>
          )}
        </For>
      </Show>
    </div>
  );
};

export default function Chat({ chat }: { chat: Chat }) {
  const { ToggleEditModalButton, EditModal, openEditModal } =
    useEditChatModal(chat);

  // const { ToggleRAGModalButton, EditRAGModal } = useRAGSettings(chat);

  const {
    AddImageBtn,
    SelectedImages,
    images,
    clear: clearImages,
  } = useBase64ImageSelect();

  const messages = createLiveQuery(
    () =>
      db.chatMessages
        .where({ chatId: chat?.id ?? -1 })
        .reverse()
        .toArray(),
    [],
    { key: "content" },
  );

  let inputRef: HTMLTextAreaElement | undefined;
  const [message, setMessage] = createSignal("");
  const { error, loading, abort, mutate, retry } =
    createChatcompletionMutation(chat);

  const send = async () => {
    if (!message()) return;
    mutate({
      message: message(),
      images: images(),
      done: () => inputRef?.focus(),
    });
    setMessage("");
    clearImages();
  };

  createEffect(() => {
    // if this chat has no model or url, open the edit modal
    if (!chat.config.model || !chat.config.url) {
      openEditModal();
    }
  });

  return (
    <div class="flex h-full w-full max-w-full flex-col">
      <EditModal />
      <ul class="mb-1 flex flex-1 flex-col-reverse gap-5 overflow-auto overflow-y-auto border-0 pb-2">
        {/* Error and retry */}
        <Show when={error()}>
          <li
            class="flex w-fit flex-row flex-wrap items-center justify-center gap-2 self-center p-2 text-xs"
            aria-label="Fehler beim senden"
          >
            <div class="paper p-1 text-center text-gray-400">
              <i class="ti ti-bolt me-1 text-red-500" />
              {error()?.message || "Fehler beim Senden der Nachricht"}
            </div>
            <button
              class="paper p-1 text-green-500 hover:text-green-700"
              aria-label="Erneut versuchen"
              onClick={retry}
            >
              <i class="ti ti-reload" />
            </button>
          </li>
        </Show>

        {/* Display Selected Images */}
        <SelectedImages />

        <For each={messages}>
          {(message) => {
            return (
              <li
                class={`flex max-w-[80%] flex-col gap-1 ${message.role === "assistant" ? "w-[80%] max-w-[800px] self-center" : "self-end break-words"}`}
              >
                <WebsearchStatistics message={message} />

                <div
                  class={`${message.role === "assistant" ? "" : "paper rounded-2xl rounded-br-none px-4 py-2"} `}
                >
                  <MarkdownPreview
                    fallback={
                      <Container label="">
                        <i class="ti ti-loader animate-spin" />
                        Auswerten
                      </Container>
                    }
                    content={() => message.content}
                  />
                </div>
                <Show when={message.role === "assistant" && message.done}>
                  <AssistentMessageStatistics message={message} />
                </Show>

                <Show when={message.role === "user"}>
                  <UserMessageStatistics message={message} />
                </Show>
              </li>
            );
          }}
        </For>
      </ul>

      <div class="scrollbar-none paper flex flex-col p-2 focus-within:shadow-2xl">
        <textarea
          value={message()}
          onInput={(e: any) => setMessage(e.currentTarget.value)}
          onKeyDown={(e: any) => e.key === "Enter" && e.metaKey && send()}
          class="no-scrollbar flex-1 resize-none text-gray-500 focus:outline-hidden"
          placeholder="Nachricht eingeben"
          disabled={loading()}
          autofocus
          ref={inputRef}
        />

        <div class="flex flex-row justify-between gap-2">
          <div class="flex flex-row gap-2">
            <Tooltip
              label={
                <>
                  Websuche ist{" "}
                  <span
                    class={
                      chat.websearch?.enabled ? "text-green-500" : undefined
                    }
                  >
                    {chat.websearch?.enabled ? "aktiviert" : "deaktiviert"}
                  </span>
                </>
              }
            >
              <button
                class="icon-btn"
                onClick={() => {
                  const websearchEnabled = chat.websearch?.enabled ?? false;
                  db.chats.update(chat.id, {
                    "websearch.enabled": !websearchEnabled,
                  });
                }}
                aria-label="Websuche"
              >
                <i
                  class={`ti ${chat.websearch?.enabled ? "ti-world" : "ti-world-off"}`}
                />
              </button>
            </Tooltip>

            <AddImageBtn />

            <Tooltip label={"Einstellungen"}>
              <ToggleEditModalButton />
            </Tooltip>
          </div>

          <Tooltip label={loading() ? "Abbrechen" : "⌘ + ⏎"}>
            <button
              class="icon-btn"
              onClick={() => (loading() ? abort() : send())}
              aria-label={loading() ? "Senden abbrechen" : "Nachricht senden"}
            >
              <i class={`ti ${loading() ? "ti-forbid-2" : "ti-send"}`} />
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
