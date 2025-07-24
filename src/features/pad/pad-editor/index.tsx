import MarkdownPreview from "@/components/core/MarkdownPreview";
import { createEffect } from "solid-js";
import { createPadStore, type MarkdownPad, padTitle } from "../util";
import Editor from "./editor";

import howto from "./howto.md?raw";
import { createStore } from "solid-js/store";
import { nanoid } from "nanoid";

console.log(howto);

/**
 * Main pad editor component with view modes (editor/split/preview)
 */
const PadView = ({
  view,
  padId,
}: {
  padId: string;
  view: "editor" | "split" | "preview";
}) => {
  // Get or create pad with localStorage persistence
  console.log(padId);
  const [padValue, setPadValue] =
    padId !== "howto"
      ? createPadStore(padId)
      : createStore<MarkdownPad>({
          content: howto,
          created: new Date(),
          updated: new Date(),
          id: nanoid(),
        });

  // Update window title when pad changes
  createEffect(() => {
    document.title = padTitle(padValue);
  });

  return (
    <div class="flex h-full w-full flex-1 flex-row overflow-hidden">
      {(view === "editor" || view === "split") && (
        <Editor pad={padValue} setPad={setPadValue} />
      )}
      {(view === "preview" || view === "split") && (
        <div class="flex-1 overflow-y-auto p-2">
          <MarkdownPreview content={() => padValue.content} />
        </div>
      )}
    </div>
  );
};

export default PadView;
