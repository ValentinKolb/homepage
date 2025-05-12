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

    // sync with onChange
    jar.onUpdate((newValue) => {
      if (newValue === value()) return;

      console.log(newValue);

      onChange(newValue);
    });
  });

  // sync editor content with value prop
  createEffect(() => {
    if (!jar) return;

    const currentText = jar.toString();
    if (value() === currentText) return;
    let cursorPos = null;
    try {
      cursorPos = jar.save();
    } catch (_) {}

    jar.updateCode(value());

    if (cursorPos) {
      jar.restore(cursorPos);
    }
  });

  onCleanup(() => {
    if (jar) {
      jar.destroy();
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
