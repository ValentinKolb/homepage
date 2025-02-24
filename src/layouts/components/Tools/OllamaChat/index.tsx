import SidebarLayout from "@/components/ui/SidebarLayout";
import ChatsList from "./ChatsList";
import { db, useChatQueryParam } from "./db";
import { createEffect, Show } from "solid-js";
import { createLiveQuery } from "@/lib/solidjs/db-utils";
import Chat from "./Chat";
import Help from "./Help";

const OllamaChat = () => {
  const [chatParam] = useChatQueryParam();

  const chat = createLiveQuery(() => db.chats.get(chatParam() || -1));

  return (
    <div class="flex flex-1 overflow-hidden bg-gray-100">
      <SidebarLayout sidebar={<ChatsList />}>
        <Show
          when={chatParam() && chat?.id}
          fallback={
            <div class="flex h-full w-full items-center justify-center">
              <Help />
            </div>
          }
        >
          <div class="flex h-full w-full flex-col gap-1">
            <Chat chat={chat!} />
          </div>
        </Show>
      </SidebarLayout>
    </div>
  );
};

export default OllamaChat;
