import SidebarLayout from "@/components/solidjs/SidebarLayout";
import { createLiveQuery } from "@/lib/solidjs/db-utils";
import { Show } from "solid-js";
import Chat from "./components/Chat";
import ChatsList from "./components/ChatsList";
import { db, useChatQueryParam } from "./utils/db";
import Help from "./components/Help";

const OllamaChat = () => {
  const [chatParam] = useChatQueryParam();

  const chat = createLiveQuery(() => db.chats.get(chatParam() || -1));

  return (
    <div class="flex flex-1 overflow-hidden dark:bg-black">
      <SidebarLayout sidebar={<ChatsList />}>
        <Show
          when={chatParam() && chat?.id}
          fallback={
            <div class="flex h-full w-full items-center justify-center">
              <Help />
            </div>
          }
        >
          <div class="flex h-full w-full">
            <Chat chat={chat!} />
          </div>
        </Show>
      </SidebarLayout>
    </div>
  );
};

export default OllamaChat;
