import { getIconForFileType } from "@/lib/utils/fileicons";
import { markdownToHtml } from "@/lib/utils/markdown";
import {
  createEffect,
  createSignal,
  type JSX,
  type ParentProps,
  Show,
} from "solid-js";
import mermaid from "mermaid";

// Initialize mermaid
if (window) {
  mermaid.initialize({ startOnLoad: false, theme: "dark" });
}

type MarkdownPreviewProps = {
  content: () => string;
  fallback?: JSX.Element;
  class?: string;
  id?: string;
} & ParentProps;

function MarkdownPreview({
  content,
  id,
  fallback = null,
  class: className,
}: MarkdownPreviewProps) {
  const [htmlContent, setHtmlContent] = createSignal("");
  let containerRef: HTMLDivElement | undefined;

  createEffect(async () => {
    const md = content();
    if (!md) return;
    const rendered = await markdownToHtml(md);
    setHtmlContent(rendered);
  });

  createEffect(() => {
    if (!htmlContent()) return;

    // Links target="_blank" setzen
    const linkElements = containerRef?.querySelectorAll("a");
    linkElements?.forEach((link) => {
      link.target = "_blank";
    });

    // Make code blocks pretty
    const preElements = containerRef?.querySelectorAll("pre");
    preElements?.forEach((pre) => {
      const code = pre.querySelector("code");
      if (!code) return;

      enhanceCodeBlock(pre, code);
    });

    mermaid.run({
      querySelector: ".language-mermaid",
    });
  });

  return (
    <Show when={htmlContent()} fallback={fallback}>
      <div
        id={id}
        ref={containerRef}
        class={`prose prose-sm md:prose-base dark:prose-invert prose-pre:p-0 max-w-none break-words ${className}`}
        innerHTML={htmlContent()}
      />
    </Show>
  );
}

function enhanceCodeBlock(pre: HTMLPreElement, code: HTMLElement) {
  const codeText = code.innerText;
  const ID = "code-controls";

  if (code.querySelector(`.${ID}`)) return; // skip if already exists

  // Language Label
  const langClass = code.className
    .split(/\s+/)
    .find((cls) => cls.startsWith("language-"));

  if (langClass === "language-mermaid") {
    return;
  }

  // Controls Container
  const controlsDiv = document.createElement("div");
  controlsDiv.className = `${ID} print:hidden p-1 px-2 flex items-center text-xs font-mono justify-between text-gray-200 bg-gray-800`;

  const lang = langClass?.substring("language-".length) ?? "code";
  const label = document.createElement("span");
  label.textContent = lang.toUpperCase();
  label.className = "text-gray-500";

  const icon = getIconForFileType(lang);
  if (icon) {
    const iconElement = document.createElement("i");
    iconElement.className = `mr-1 ti ${icon}`;
    label.prepend(iconElement);
  }
  controlsDiv.appendChild(label);

  // Copy Button
  addCopyButton(controlsDiv, codeText);

  // Add controls div to parent pre
  pre.prepend(controlsDiv);
}

function addCopyButton(container: HTMLElement, code: string) {
  const button = document.createElement("button");
  button.ariaLabel = "Code kopieren";
  button.className = "p-1 cursor-pointer hover-text ti ti-clipboard";

  button.addEventListener("click", () => {
    navigator.clipboard.writeText(code).then(() => {
      button.classList.remove("ti-clipboard");
      button.classList.add("ti-check");
      setTimeout(() => {
        button.classList.remove("ti-check");
        button.classList.add("ti-clipboard");
      }, 2000);
    });
  });

  container.appendChild(button);
}

export default MarkdownPreview;
