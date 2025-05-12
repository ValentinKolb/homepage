import CodeEditor from "@/components/ui/CodeEditor";
import { db, type EditorFile } from "../../utils/db";
import { createSignal, createEffect, onCleanup } from "solid-js";

export default function FileOpened({
  file,
}: {
  file: () => EditorFile | undefined;
}) {
  if (!file()) return null;

  if (file()?.type === "text") {
    // Create a local signal for content to reduce DB updates
    const [fileContent, setFileContent] = createSignal<string>(
      // @ts-ignore
      file()?.content ?? ""
    );

    // Create a debounced update function
    let saveTimeout: number | null = null;

    const saveToDb = (content: string) => {
      if (saveTimeout) {
        window.clearTimeout(saveTimeout);
      }

      saveTimeout = window.setTimeout(() => {
        db.files.update(file()!.id, {
          // @ts-ignore
          content,
          timestamp: Date.now(),
        });
        saveTimeout = null;
      }, 300); // 300ms debounce for DB writes
    };

    // Update fileContent when file changes
    createEffect(() => {
      if (file() && file()?.type === "text") {
        // @ts-ignore
        setFileContent(file()?.content ?? "");
      }
    });

    // Clean up timeout on component unmount
    onCleanup(() => {
      if (saveTimeout) {
        window.clearTimeout(saveTimeout);
      }
    });

    return (
      <CodeEditor
        class={() => "h-full w-full"}
        filename={() => file()?.name ?? ""}
        value={fileContent}
        onChange={(content) => {
          setFileContent(content);
          saveToDb(content);
        }}
      />
    );
  }

  return (
    <div class="flex h-full w-full items-center justify-center">
      <p class="text-sm text-gray-500">
        Der Dateityp von <span class="font-mono">{file()?.name}</span> wird von
        diesem Editor nicht unterstützt.
      </p>
    </div>
  );
}
