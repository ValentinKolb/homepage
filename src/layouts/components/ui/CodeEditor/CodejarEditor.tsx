import { createClipboard } from "@/lib/solidjs/clipboard";
import { getFileExtension, getIconForFileType } from "@/lib/utils/fileicons";
import { CodeJar } from "codejar";
import hljs from "highlight.js";
import { createEffect, type JSX, onCleanup, onMount } from "solid-js";
import { createMarkdownExtenstion } from "./MarkdownExtention";

// highlight function with highlight.js
const highlight = (language: string) => (editor: HTMLElement) => {
  const highlightedContent = hljs.highlight(editor.textContent || "", {
    language,
  }).value;

  editor.innerHTML = highlightedContent;
};

export type CodeEditorExtension = (
  props: Pick<CodeEditorProps, "value" | "filename">,
) => {
  Slot: () => JSX.Element;
  Controls: () => JSX.Element;
};

type CodeEditorProps = {
  filename: () => string;
  value: () => string;
  onChange: (value: string) => void;
  class?: () => string;
};

/**
 * if not filename is provided, the language is autodetected
 */
const CodeEditor = ({
  value,
  filename,
  onChange,
  class: className,
}: CodeEditorProps) => {
  let editorRef: HTMLDivElement | undefined;
  let jar: CodeJar | undefined;
  // Store the active timeout for cleanup
  let activeTimeout: number | null = null;

  const lineCount = () => value().split("\n").length;
  const language = () => {
    const fileType = getFileExtension(filename());
    return hljs.getLanguage(fileType) ? fileType : "plaintext";
  };

  const { copy, wasCopied } = createClipboard();

  const { Controls: MarkdownControls, Slot: MarkdownSlot } =
    createMarkdownExtenstion({ filename, value });

  onMount(() => {
    if (!editorRef) return;

    // init codejar
    jar = CodeJar(editorRef, highlight(language()), {
      tab: "  ", // 2 spaces for tab instead '\t'
      indentOn: /[({[]$/,
      spellcheck: false,
    });

    // set inital value
    jar.updateCode(value() || "");

    // Debounce setup with shared timeout variable for cleanup
    let lastProcessedValue = value();
    let pendingValue: string | null = null;

    // sync with onChange with improved debounce
    jar.onUpdate((newValue) => {
      if (newValue === lastProcessedValue) return;

      // Store the pending value
      pendingValue = newValue;

      // If no timeout is active, create one
      if (!activeTimeout) {
        // Clear any existing timeout (safety check)
        if (activeTimeout) {
          window.clearTimeout(activeTimeout);
        }

        activeTimeout = window.setTimeout(() => {
          // Only update if there's a pending value and it's different from last processed
          if (pendingValue && pendingValue !== lastProcessedValue) {
            lastProcessedValue = pendingValue;
            onChange(pendingValue);
          }
          pendingValue = null;
          activeTimeout = null;
        }, 100);
      }
    });
  });

  // sync editor content with value prop
  let lastExternalValue = value();
  let isInternalUpdate = false;

  createEffect(() => {
    if (!jar) return;

    // Prevent updates during internal changes
    if (isInternalUpdate) return;

    const newExternalValue = value();

    // Only update if value has been externally changed
    if (newExternalValue === lastExternalValue) return;

    // Don't update if the editor already has this text
    const currentText = jar.toString();
    if (newExternalValue === currentText) return;

    // Synchronize with a small delay to avoid conflicts with typing
    const updateEditor = () => {
      // Mark that we're updating internally to prevent recursive updates
      isInternalUpdate = true;

      // Save cursor position if possible
      let cursorPos = null;
      try {
        cursorPos = jar!.save();
      } catch (e) {
        console.debug("Couldn't save cursor position", e);
      }

      try {
        // Update the editor with the new external value
        jar!.updateCode(newExternalValue);
        lastExternalValue = newExternalValue;

        // Restore cursor position if possible
        if (cursorPos) {
          try {
            jar!.restore(cursorPos);
          } catch (e) {
            console.debug("Couldn't restore cursor position", e);
          }
        }
      } finally {
        // Always reset the internal update flag
        isInternalUpdate = false;
      }
    };

    // Use requestAnimationFrame for smoother updates
    requestAnimationFrame(updateEditor);
  });

  onCleanup(() => {
    // Clear any pending timeouts
    if (activeTimeout) {
      window.clearTimeout(activeTimeout);
      activeTimeout = null;
    }

    // Destroy the editor
    if (jar) {
      jar.destroy();
      jar = undefined;
    }
  });

  return (
    <div class={`flex flex-row ${className?.() || "min-h-32"}`}>
      <div
        class={`dark:bg-dark flex w-full flex-1 flex-col gap-4 overflow-auto font-mono outline-none dark:text-[#c9d1d9]`}
      >
        <div class="flex-1 p-2 px-3 ps-2 text-sm" ref={editorRef} />

        <div class="flex flex-row gap-2 p-2 px-3 text-xs text-gray-500">
          <div class="">{filename()}</div>
          {"|"}
          <div>{lineCount()} LOC</div>
          {"|"}
          <button
            class={`hover-text ti me-auto cursor-pointer ${wasCopied() ? "ti-clipboard-check" : "ti-clipboard"}`}
            onClick={() => copy(value())}
            aria-label="Code kopieren"
          />

          <MarkdownControls />

          <i class={`ti self-center ${getIconForFileType(filename())}`} />

          <div>
            {hljs.getLanguage(getFileExtension(filename()))?.name ||
              getFileExtension(filename())}
          </div>
        </div>
      </div>

      <MarkdownSlot />
    </div>
  );
};

export default CodeEditor;
