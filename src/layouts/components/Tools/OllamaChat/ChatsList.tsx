import { createLiveQuery } from "@/lib/solidjs/db-utils";
import { db, newChat, useChatQueryParam } from "./db";
import { For, Show } from "solid-js";
import Tooltip from "@/components/ui/Tooltip";
import Loader from "@/components/ui/Loader";
import { createAutoAnimate } from "@formkit/auto-animate/solid";

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
        class="-mx-10 h-full space-y-1 overflow-y-auto px-10 scrollbar-none"
      >
        {/* add new chat button */}
        <li
          class={`cursor-pointer truncate rounded-lg border-0 bg-white p-4 py-2 text-sm font-bold text-gray-500 shadow-md hover:text-gray-700`}
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
              class={`cursor-pointer truncate rounded-lg border-0 bg-white p-4 text-sm text-gray-500 shadow-md hover:text-gray-700 ${chat.id === chatParam() ? "font-bold text-gray-700 shadow-xl" : ""}`}
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
