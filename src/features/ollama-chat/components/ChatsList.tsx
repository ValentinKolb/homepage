import Loader from "@/components/ui/Loader";
import { createLiveQuery } from "@/lib/solidjs/db-utils";
import { createAutoAnimate } from "@formkit/auto-animate/solid";
import { For, Show } from "solid-js";
import { db, newChat, useChatQueryParam } from "../utils/db";

export default function ChatsList() {
  const [animationParent] = createAutoAnimate();

  const chats = createLiveQuery(
    () => db.chats.orderBy("latestMessageDate").reverse().toArray(),
    [],
  );

  const [chatParam, setChatParam] = useChatQueryParam();

  // create new chat and navigate to it
  const addChat = async () => {
    const c = await newChat();
    setChatParam(c);
  };

  return (
    <Show when={chats} fallback={<Loader />}>
      <ul
        ref={animationParent}
        class="no-scrollbar flex h-full flex-col gap-1 overflow-y-auto"
      >
        {/* add new chat button */}
        <li
          class={`paper cursor-pointer truncate p-3 py-2 text-xs font-bold`}
          onClick={addChat}
          aria-label="Neuen Chat erstellen"
        >
          <i class="ti ti-plus mr-2" />
          Neuen Chat erstellen
        </li>

        {/* list of chats */}
        <For each={chats}>
          {(chat) => (
            <li
              class={`hover-text cursor-pointer truncate p-2 text-xs ${chat.id === chatParam() ? "font-bold text-gray-700 dark:text-gray-200" : ""}`}
              onClick={() => setChatParam(chat.id)}
              aria-label={`Chat '${chat.name}' auswählen`}
            >
              {chat.name}
            </li>
          )}
        </For>
      </ul>
    </Show>
  );
}
