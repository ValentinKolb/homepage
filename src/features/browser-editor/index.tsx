import SidebarLayout from "@/components/core/SidebarLayout";
import { createLiveQuery } from "@/lib/solidjs/db-utils";
import { createEffect } from "solid-js";
import FileList from "./components/FileList";
import { db } from "./utils/db";
import OpenFilesView from "./components/OpenFilesView";

export default function BrowserEditor() {
  const files = createLiveQuery(() => db.files.toArray(), []);

  createEffect(() => {
    console.log("Files changed:", files?.length && files[0].controls);
  });

  return (
    <div class="flex flex-1 overflow-hidden dark:bg-black">
      <SidebarLayout sidebar={<FileList files={files ?? []} />}>
        <OpenFilesView />
      </SidebarLayout>
    </div>
  );
}
