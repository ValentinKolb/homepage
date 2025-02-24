import hljs from "highlight.js";
import { marked, type MarkedExtension } from "marked";
import { markedHighlight } from "marked-highlight";
import markedKatex from "marked-katex-extension";
import { createEffect, createSignal, type JSX, Show } from "solid-js";

function thinkBlockFormatter() {
  return {
    extensions: [
      {
        name: "thinkBlockFormatter",
        level: "block",
        tokenizer(src: string) {
          const match = src.match(/<think>(.*?)(?:<\/think>|$)/s);
          if (match) {
            return {
              type: "thinkBlockFormatter",
              raw: match[0],
              text: match[0].trim(),
            };
          }
        },
        renderer: (token: { text: string }) =>
          `
          <details open class="bg-gray-100 p-2 text-sm rounded-lg">
            <summary class="cursor-pointer font-bold">Nachdenken</summary>
            <div class="italic p-1 text-gray-500">${token.text}</div>
            </details>
          `,
      },
    ],
  };
}

marked.use(
  markedHighlight({
    emptyLangClass: "hljs",
    langPrefix: "hljs language-",
    highlight(code, lang, info) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
  }),
  markedKatex({
    throwOnError: false,
  }),
  thinkBlockFormatter() as MarkedExtension,
);

type LazyMarkdownProps = {
  content: () => string;
  fallback?: JSX.Element;
};

function LazyMarkdown({ content, fallback = null }: LazyMarkdownProps) {
  const [htmlContent, setHtmlContent] = createSignal("");
  let containerRef: HTMLDivElement | undefined;

  createEffect(async () => {
    const md = content();
    if (!md) return;
    const rendered = await marked.parse(md);
    setHtmlContent(rendered);
  });

  // create a button to copy code snippets
  createEffect(() => {
    if (!htmlContent()) return;
    const preElements = containerRef?.querySelectorAll("pre");
    preElements?.forEach((pre) => {
      if (pre.querySelector(".copy-code-btn")) return;
      pre.style.position = "relative";
      const button = document.createElement("button");
      button.textContent = "📋 Kopieren";
      button.className =
        "copy-code-btn absolute top-1 right-1 p-1 text-xs cursor-pointer hover:bg-gray-700 rounded-lg";
      button.addEventListener("click", () => {
        const codeEl = pre.querySelector("code");
        if (!codeEl) return;
        navigator.clipboard
          .writeText(codeEl.innerText)
          .then(() => {
            button.textContent = "✔ Kopiert!";
            setTimeout(() => (button.textContent = "📋 Kopieren"), 2000);
          })
          .catch((err) => console.error("Copy failed:", err));
      });
      pre.appendChild(button);
      // --- Language-Label ---
      const codeEl = pre.querySelector("code");
      if (!pre.querySelector(".language-label") && codeEl) {
        const langClass = codeEl.className
          .split(/\s+/)
          .find((cls) => cls.startsWith("language-"));
        if (!langClass) return;
        const label = document.createElement("div");
        label.textContent = langClass
          .substring("language-".length)
          .toUpperCase();
        label.className =
          "language-label absolute bottom-1 right-1 p-1 text-xs text-gray-500";
        pre.appendChild(label);
      }
    });
  });

  return (
    <Show when={htmlContent()} fallback={fallback}>
      <div
        ref={containerRef}
        class="prose max-w-none"
        innerHTML={htmlContent()}
      />
    </Show>
  );
}

export default LazyMarkdown;
