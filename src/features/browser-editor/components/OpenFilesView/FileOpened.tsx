import CodeEditor from "@/components/ui/CodeEditor";
import { db, type EditorFile } from "../../utils/db";

export default function FileOpened({
  file,
}: {
  file: () => EditorFile | undefined;
}) {
  if (!file()) return null;

  if (file()?.type === "text") {
    return (
      <CodeEditor
        class={() => "h-full w-full"}
        filename={() => file()?.name ?? ""}
        value={() => {
          // @ts-ignore
          return file()?.content ?? "";
        }}
        onChange={(content) => {
          db.files.update(file()!.id, {
            // @ts-ignore
            content,
            timestamp: Date.now(),
          });
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
