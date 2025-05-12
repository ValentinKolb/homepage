import { For, Show } from "solid-js";
import { db, useOpenedFile } from "../../utils/db";
import { createLiveQuery } from "@/lib/solidjs/db-utils";
import NoFileOpend from "./NoFileOpened";
import FileOpened from "./FileOpened";

export default function OpenFilesView({}: {}) {
  const openFiles = createLiveQuery(
    () =>
      db.files
        .where("type")
        .notEqual("folder")
        .and((file) => (file.controls.opened ?? 0) > 0)
        .sortBy("controls.opened"),
    [],
  );

  // query param of open file id
  const { openFile, openFileHandler, closeFileHandler, deselectFile } =
    useOpenedFile();

  const borderColor = "border-[var(--color-dark)] dark:border-gray-800";

  return (
    <div class="flex h-full w-full flex-col">
      {/* Tabs with horizontal scrolling without visible scrollbar */}
      <Show when={openFiles?.length}>
        <div
          class="no-scrollbar flex flex-row flex-nowrap overflow-x-auto font-mono text-xs"
          onWheel={(e) => {
            if (e.deltaX) return; // trackpad horizontal scrolling
            e.currentTarget.scrollLeft += e.deltaY;
            e.preventDefault();
          }}
        >
          <For each={openFiles}>
            {(file, index) => (
              <div
                class={`flex cursor-pointer flex-row flex-nowrap items-center gap-1 border-1 border-r-0 p-1 px-2 ${borderColor}`}
                classList={{
                  "border-b-[var(--color-dark)] dark:border-b-[var(--color-dark)] dark:bg-dark dark:text-white font-bold":
                    openFile()?.id === file.id,
                  "rounded-tl-lg": index() === 0,
                }}
                onClick={() => openFileHandler(file)}
              >
                <span class="max-w-[30ch] truncate overflow-hidden text-nowrap">
                  {file.name}
                </span>
                <button
                  class="ti ti-x hover-text"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeFileHandler(file);
                  }}
                  aria-label={`${file.name} schließen`}
                />
              </div>
            )}
          </For>

          <button
            class={`ti ti-plus rounded-tr-lg border-1 p-1 px-2 ${borderColor}`}
            onClick={() => deselectFile()}
          />

          <div class={`w-full border-b-1 ${borderColor}`} />
        </div>
      </Show>

      {/* Editor */}
      <Show when={openFile() !== undefined} fallback={<NoFileOpend />}>
        <div
          class={`flex-1 overflow-hidden rounded-b-lg border-1 border-t-0 ${borderColor}`}
        >
          <FileOpened file={openFile} />
        </div>
      </Show>
    </div>
  );
}
