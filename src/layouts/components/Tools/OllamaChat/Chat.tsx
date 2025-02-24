import Tooltip from "@/components/ui/Tooltip";
import useEditChatModal from "./EditChatModal";
import { Ollama, type Message } from "ollama";
import { db, type Chat, type ChatMessage } from "./db";
import { createEffect, createSignal, For, Show, type JSX } from "solid-js";
import { createLiveQuery } from "@/lib/solidjs/db-utils";
import createModal from "@/components/ui/Modal";
import Help from "./Help";
import LazyMarkdown from "@/components/ui/LazyMarkdown";
import { createMutation } from "@/lib/solidjs/mutation";
import { createClipboard } from "@/lib/solidjs/clipboard";
import convert from "convert";

const createSendMutation = (chat: Chat) =>
  createMutation({
    // create context for the mutation (only runs once even if the mutation is retried)
    onBefore: async ({
      message,
      done,
    }: {
      message: string;
      done: () => void;
    }) => {
      // create user send message here to avoid recreating it in the mutation if it is retried
      await db.chatMessages.add({
        chatId: chat.id,
        role: "user",
        content: message,
        timestamp: Date.now(),
      });

      return {
        // create new ollama instance
        ollama: new Ollama({ host: chat.config.url }),

        // create a slot in the context to store the message id of the new message
        // this is used do delete the message if the mutation is aborted or errors out
        newMessageId: null as number | null,

        // add done function to the context to focus the input field after sending the message
        done,
      };
    },
    mutation: async (_, ctx) => {
      // step 1: get the message history for this chat (which includes the message with the user question)
      const messages = (
        await db.chatMessages
          .where({ chatId: chat.id })
          .reverse()
          .limit((chat.config.retention ?? 100) + 1)
          .toArray()
      ).reverse();

      // step 2: create a new message in the db where the data is beeing streamed into
      const newMessageId = await db.chatMessages.add({
        chatId: chat.id,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
      });
      // set the new message id in the context
      ctx.newMessageId = newMessageId;

      // step 3: send messages to ollama
      const response = await ctx.ollama.chat({
        model: chat.config.model ?? "",
        messages: messages,
        stream: true,
      });

      // step 4: update message content in db
      let content = "";
      for await (const part of response) {
        if (ctx.abortSignal.aborted) {
          break;
        }
        content += part.message.content;
        await db.chatMessages.update(newMessageId, {
          content,
          done: part.done,
          meta: {
            model: part?.model,
            total_duration: part?.total_duration,
            prompt_eval_count: part?.prompt_eval_count,
            prompt_eval_duration: part?.prompt_eval_duration,
            eval_count: part?.eval_count,
            eval_duration: part?.eval_duration,
          },
        });
      }
    },
    onSuccess: async (_, ctx) => {
      db.chats.update(chat.id, { latestMessageDate: Date.now() });
    },
    onFinally: async (ctx) => {
      // call done function to focus the input field
      ctx?.done();
    },
    onError: async (_, ctx) => {
      // if there was an error, delete the message
      if (ctx?.newMessageId) {
        await db.chatMessages.delete(ctx.newMessageId);
      }
      console.error("Error sending message");
    },
    onAbort: async (ctx) => {
      // if the mutation was aborted, delete the message
      if (ctx?.newMessageId) {
        await db.chatMessages.delete(ctx.newMessageId);
      }
      console.log("Sending message aborted");
    },
  });

const MessageStatistics = ({ message }: { message: ChatMessage }) => {
  const PRECISION = 1;

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

  const totalSeconds = `${quantity.toFixed(PRECISION)} ${unit}`;

  const { copy, wasCopied } = createClipboard();

  const Container = ({
    children,
    label,
  }: {
    children: JSX.Element;
    label: string;
  }) => (
    <Tooltip label={label}>
      <div class="flex flex-row items-center justify-center gap-1 rounded-md border-0 bg-gray-200 p-1 px-2">
        {children}
      </div>
    </Tooltip>
  );

  return (
    <div class="flex flex-row flex-wrap gap-1 font-mono text-[8px] text-gray-400 md:text-[10px]">
      <Container label="Gesamtzeit">
        <i class="ti ti-clock" />
        {totalSeconds}
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
          class={`cursor-pointer font-bold hover:text-gray-700`}
          onClick={() => copy(message.content)}
          aria-label="Nachricht kopieren"
        >
          <i
            class={`ti mr-1 cursor-pointer ${wasCopied() ? "ti-clipboard-check" : "ti-clipboard"}`}
          />
          {wasCopied() ? "Kopiert!" : "Kopieren"}
        </button>
      </Container>
    </div>
  );
};

export default function Chat({ chat }: { chat: Chat }) {
  const { ToggleEditModalButton, EditModal, openEditModal } =
    useEditChatModal(chat);

  const { Modal: HelpModal, openModal: openHelpModal } = createModal();

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
  const { error, loading, abort, mutate, retry } = createSendMutation(chat);

  const send = async () => {
    if (!message()) return;
    mutate({
      message: message(),
      done: () => inputRef?.focus(),
    });
    setMessage("");
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
      <HelpModal>
        <Help />
      </HelpModal>
      <ul class="mb-1 flex flex-1 flex-col-reverse gap-1 overflow-auto rounded-lg border-0">
        <Show when={error()}>
          <li
            class="flex w-fit flex-row flex-wrap items-center justify-center gap-2 self-center p-2 text-xs"
            aria-label="Fehler beim senden"
          >
            <div class="rounded-md border-0 bg-white p-1 text-center text-gray-400 shadow-md">
              <i class="ti ti-bolt me-1 text-red-500" />
              {error()?.message || "Fehler beim Senden der Nachricht"}
            </div>
            <button
              class="rounded-md bg-white p-1 text-green-500 shadow-lg hover:text-green-700 hover:shadow-xl"
              aria-label="Erneut versuchen"
              onClick={retry}
            >
              <i class="ti ti-reload" />
            </button>
          </li>
        </Show>

        <For each={messages}>
          {(message, i) => {
            return (
              <li
                class={`flex max-w-[80%] flex-col gap-1 ${message.role === "assistant" ? "self-start [&>div]:rounded-bl-none" : "self-end [&>div]:rounded-br-none"}`}
              >
                <div class={`rounded-2xl border-0 bg-white p-2`}>
                  <LazyMarkdown
                    fallback={
                      <i class="ti ti-dots mx-2 inline-block animate-pulse text-sm text-gray-400" />
                    }
                    content={() => message.content}
                  />
                </div>

                <Show when={message.role === "assistant" && message.done}>
                  <MessageStatistics message={message} />
                </Show>
              </li>
            );
          }}
        </For>
      </ul>

      <div class="flex flex-col rounded-lg bg-white p-2 scrollbar-none focus-within:shadow-2xl">
        <textarea
          value={message()}
          onInput={(e: any) => setMessage(e.currentTarget.value)}
          onKeyDown={(e: any) => e.key === "Enter" && e.metaKey && send()}
          class="no-scrollbar flex-1 resize-none text-gray-500 focus:outline-none"
          placeholder="Nachricht eingeben"
          disabled={loading()}
          autofocus
          ref={inputRef}
        />

        <div class="flex flex-row justify-between gap-2">
          <div class="flex flex-row gap-2">
            <Tooltip label="Websuche">
              <button
                class="h-8 w-8 rounded-lg border-0 bg-white text-gray-500 shadow-md hover:text-gray-700 focus:ring-0"
                onClick={() => alert("Noch nicht implementiert")}
                aria-label="Websuche"
              >
                <i class="ti ti-world-off" />
              </button>
            </Tooltip>

            <ToggleEditModalButton />
            <button
              class="h-8 w-8 rounded-lg border-0 bg-white text-gray-500 shadow-md hover:text-gray-700 focus:ring-0"
              onClick={() => openHelpModal()}
              aria-label="Informationen über dieses Tool anzeigen"
            >
              <i class="ti ti-question-mark" />
            </button>
          </div>
          <Tooltip label={loading() ? "Abbrechen" : "⌘ + ⏎"}>
            <button
              class="h-8 w-8 rounded-lg border-0 bg-white text-gray-500 shadow-md hover:text-gray-700 focus:ring-0"
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
