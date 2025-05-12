import Tooltip from "@/components/ui/Tooltip";
import { createFile, db, useOpenedFile } from "../../utils/db";
import { formatDate, uploadFile } from "../../utils/lib";
import { createEffect, createSignal, For, Show } from "solid-js";
import { createLiveQuery } from "@/lib/solidjs/db-utils";

export default function NoFileOpend() {
  const recentFiles = createLiveQuery(
    () =>
      db.files
        .orderBy("timestamp")
        .reverse()
        .filter((f) => f.type !== "folder")
        .limit(5)
        .toArray(),
    [],
  );
  const [newFileName, setNewFileName] = createSignal("");
  const { openFileHandler } = useOpenedFile();

  const submitNewFile = async () => {
    if (!newFileName()) return;
    const id = await createFile({
      name: newFileName(),
    });
    openFileHandler(id);
    setNewFileName("");
  };

  return (
    <div class="flex h-full w-full flex-col items-center justify-center gap-4">
      <div class="flex w-full max-w-md flex-col items-center gap-4">
        {/* New file input and uplaod */}
        <div class="flex w-full flex-row gap-2">
          <input
            placeholder="Neue Datei"
            class="btn-simple flex-1 text-xs focus:ring-blue-500 focus-visible:outline-none"
            aria-label="Name der neuen Datei"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                submitNewFile();
              }
            }}
            value={newFileName()}
            onInput={(e) => {
              setNewFileName(e.target.value);
            }}
          />

          <Show
            when={newFileName()}
            fallback={
              <Tooltip label="Datei hochladen">
                <button
                  class="btn-simple w-fit flex-1"
                  onClick={async () => {
                    uploadFile();
                  }}
                >
                  <i class="ti ti-upload text-xs" />
                </button>
              </Tooltip>
            }
          >
            <Tooltip label="Datei erstellen (⏎)">
              <button
                class="btn-simple w-fit flex-1"
                onClick={async () => {
                  submitNewFile();
                }}
              >
                <i class="ti ti-plus text-xs" />
              </button>
            </Tooltip>
          </Show>
        </div>

        {/* Recent files section */}
        <div class="w-full px-4">
          <div class="flex w-full flex-col gap-2 overflow-auto">
            <For each={recentFiles}>
              {(file) => (
                <button
                  class="hover-text flex w-full cursor-pointer flex-row justify-between text-start font-mono text-xs hover:underline"
                  onClick={() => openFileHandler(file)}
                >
                  <span class="flex-1">{file.name}</span>
                  <span class="">{formatDate(file.timestamp)}</span>
                </button>
              )}
            </For>
          </div>
        </div>
      </div>
    </div>
  );
}
