import ContextMenu from "@/components/ui/ContextMenu";
import { createClickOutside } from "@/lib/solidjs/click-outside";
import { getIconForFileType } from "@/lib/utils/fileicons";
import { createSignal, For, Show } from "solid-js";
import { db, useOpenedFile, type EditorFile } from "../../utils/db";
import {
  DragDropProvider,
  DragDropSensors,
  type DragEventHandler,
  createDraggable,
  createDroppable,
} from "@thisbeyond/solid-dnd";
import {
  fileMenuItems,
  folderMenuItems,
  generalMenuItems,
} from "./context-menu-items";
import { createFileTree, type FileNode } from "./util";

const RenderNode = ({ node: { file, children } }: { node: FileNode }) => {
  let ref: HTMLDivElement;

  const { openFileHandler } = useOpenedFile();

  const [newName, setNewName] = createSignal(file?.name ?? "");
  const submitRename = async () => {
    if (!file) return;
    await db.files.update(file.id, {
      name: newName() || file.name || "",
      "controls.rename": false,
    });
    setNewName(file.name);
  };

  const clickOutsideRef = createClickOutside(submitRename);
  const draggable = createDraggable(file?.id ?? "root");
  const droppable = createDroppable(file?.id ?? "root");

  return (
    <div class="flex flex-col" classList={{ "pt-1": file !== undefined }}>
      {/* render file/folder */}
      <Show when={file !== undefined}>
        <ContextMenu
          ref={clickOutsideRef}
          items={[
            [...generalMenuItems({ file })],
            ...(file!.type === "folder" ? folderMenuItems : fileMenuItems)({
              file: file!,
              focusFile: () => setTimeout(() => ref?.focus()),
            }),
          ]}
        >
          <button
            // @ts-ignore
            use:droppable
            use:draggable
            class={`group dark:hover:bg-dark flex min-h-[1ch] flex-row gap-2 rounded-lg p-1 px-2 text-[var(--color-dark)] hover:bg-gray-200 focus-visible:outline-none dark:text-white ${false ? "dark:bg-dark font-bold" : ""} // todo`}
            classList={{
              "ring ring-blue-500 ring-inset": file?.controls.rename,
              "opacity-50": draggable.isActiveDraggable,
              "ring ring-inset": droppable.isActiveDroppable,
            }}
            onClick={() => {
              if (file!.type == "folder") {
                if (file!.controls.rename) return;

                db.files.update(file!.id, {
                  "controls.opened": file!.controls.opened ? 0 : 1,
                });
                return;
              }

              openFileHandler(file!);

              if (file!.controls.opened) return; // dont overwrite openend number
              db.files.update(file!.id, { "controls.opened": Date.now() });
            }}
          >
            {/* Folder ICON */}
            <Show when={file!.type === "folder"}>
              <i
                class={`ti self-center ${file!.controls.opened ? "ti-folder-open" : "ti-folder"} `}
              />
            </Show>

            {/* File ICON */}
            <Show when={file!.type !== "folder" && file!.name !== undefined}>
              <i class={`ti self-center ${getIconForFileType(file!.name)}`} />
            </Show>

            {/* File name and rename */}
            <input
              onDblClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (file!.type === "folder") return;
                db.files.update(file!.id, { "controls.rename": true });
              }}
              onContextMenu={(e) => {
                e.preventDefault();
              }}
              ref={(r) => {
                ref = r;
              }}
              spellcheck={false}
              class={`w-min min-w-0 focus:outline-none ${file!.controls.rename ? "cursor-text underline" : "cursor-pointer caret-transparent"}`}
              classList={{
                "select-none": !file!.controls.rename,
                "opacity-60": file!.name.startsWith("."),
              }}
              aria-label={`Dateiname ${file!.name} ${file!.controls.rename ? "ändern" : "öffnen (um den Namen zu ändern das Kontextmenü nutzen)"}`}
              value={newName()}
              onKeyDown={(e) => {
                if (!file!.controls.rename) {
                  e.preventDefault();
                  e.stopPropagation();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  e.stopPropagation();
                  setNewName(file!.name);
                  db.files.update(file!.id, { "controls.rename": false });
                }
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                  submitRename();
                }
              }}
              onInput={(e) => {
                const name = e.target.value ?? "";
                setNewName(name);
              }}
            />
          </button>
        </ContextMenu>
      </Show>

      {/* render children */}
      <Show when={file?.controls.opened || file === undefined}>
        <For each={children}>
          {(child) => (
            <div
              class={
                file !== undefined
                  ? "ms-3 border-l border-[var(--color-dark)] ps-1 dark:border-white"
                  : ""
              }
            >
              <RenderNode node={child} />
            </div>
          )}
        </For>
      </Show>
    </div>
  );
};

export default function FileList(props: { files: EditorFile[] }) {
  const fileTree = createFileTree(props.files);

  const onDragEnd: DragEventHandler = async ({ draggable, droppable }) => {
    const fromFile = await db.files.get({ id: draggable?.id });
    const toFile = await db.files.get({ id: droppable?.id });

    // case no targets or drag to same file
    if (!fromFile || !toFile || fromFile.id === toFile.id) return;

    let newParentId: number | undefined = undefined;

    if (toFile.type === "folder") {
      // case drop onto folder
      newParentId = toFile.id;
    } else {
      // case drop onto file, set parent to file's parent
      newParentId = toFile.parentId;
    }

    // heck if setting this parent would create a loop
    if (fromFile.type === "folder" && newParentId) {
      const wouldCreateLoop = (fileToMove: number, targetParent: number) => {
        if (fileToMove === targetParent) return true; // case loop
        const parentFile = props.files.find((f) => f.id === targetParent);
        if (!parentFile || !parentFile.parentId) return false; // case no loop
        return wouldCreateLoop(fileToMove, parentFile.parentId); // recursive call
      };

      if (wouldCreateLoop(fromFile.id, newParentId)) {
        console.warn("Cannot move a folder into its own descendant");
        return;
      }
    }

    // f we reach here, it's safe to update the parent
    await db.files.update(fromFile.id, { parentId: newParentId });
  };

  return (
    <DragDropProvider onDragEnd={onDragEnd}>
      <DragDropSensors>
        <ContextMenu
          items={[...generalMenuItems()]}
          class="h-full w-full overflow-scroll font-mono text-xs text-gray-500"
        >
          <RenderNode node={{ children: fileTree }} />
        </ContextMenu>
      </DragDropSensors>
    </DragDropProvider>
  );
}
