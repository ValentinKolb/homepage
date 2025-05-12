import { getIconForFileType } from "@/lib/utils/fileicons";
import { markdownToHtml } from "@/lib/utils/markdown-util";
import {
  createEffect,
  createSignal,
  type JSX,
  type ParentProps,
  Show,
} from "solid-js";

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

  // create a button to copy code snippets
  // also add target="_blank" to all links
  createEffect(() => {
    if (!htmlContent()) return;
    const linkElements = containerRef?.querySelectorAll("a");
    linkElements?.forEach((link) => {
      link.target = "_blank";
    });

    const preElements = containerRef?.querySelectorAll("pre");
    preElements?.forEach((pre) => {
      const code = pre.querySelector("code");
      if (!code) return;
      const codeText = code.innerText;

      const ID = "code-controls";
      if (code.querySelector(`.${ID}`)) return; // skip if already exists

      // container div for code controls
      const div = document.createElement("div");
      div.id = ID;
      div.style.margin = "-1em -1em 1em -1em";
      div.className =
        "print:hidden p-1 px-2 flex items-center text-xs font-mono justify-between border-b-1 border-gray-800 min-w-full";
      code.prepend(div);

      // language label
      const langClass = code.className
        .split(/\s+/)
        .find((cls) => cls.startsWith("language-"));
      if (langClass) {
        const label = document.createElement("span");
        const lang = langClass.substring("language-".length);
        label.textContent = lang.toUpperCase();
        label.className = "text-gray-500";

        const icon = getIconForFileType(lang);
        if (icon) {
          const iconElement = document.createElement("i");
          iconElement.className = `mr-1 ti ${icon}`;
          label.prepend(iconElement);
        }

        div.appendChild(label);
      }

      // copy code btn
      const button = document.createElement("button");
      button.ariaLabel = "Code kopieren";
      button.dataset.status = "default";
      button.className = `p-1 cursor-pointer hover-text ti ti-clipboard`;
      button.addEventListener("click", () => {
        navigator.clipboard.writeText(codeText).then(() => {
          button.classList.remove("ti-clipboard");
          button.classList.add("ti-check");
          setTimeout(() => {
            button.classList.remove("ti-check");
            button.classList.add("ti-clipboard");
          }, 2000);
        });
      });
      div.appendChild(button);
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

export default MarkdownPreview;
