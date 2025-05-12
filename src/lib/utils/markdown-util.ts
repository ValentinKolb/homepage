import hljs from "highlight.js";
import { marked, type MarkedExtension } from "marked";
import { markedHighlight } from "marked-highlight";
import markedKatex from "marked-katex-extension";

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
          <details open class="p-2 -mb-2 text-sm bg-gray-50 dark:p-0 dark:bg-black rounded-lg">
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
    highlight(code, lang, _) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
  }),
  markedKatex({
    throwOnError: false,
  }),
  thinkBlockFormatter() as MarkedExtension,
);

const markdownToHtml = (markdown: string) => marked.parse(markdown);

export { markdownToHtml };
