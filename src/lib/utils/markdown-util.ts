import hljs from "highlight.js";
import { marked, type MarkedExtension } from "marked";
import { markedHighlight } from "marked-highlight";
import markedKatex from "marked-katex-extension";
import { languages } from "@codemirror/language-data";
import mermaid from "mermaid";

/**
 * Parses the language name and additional parameters from a code block name input.
 * @param text - The text to parse from code fence
 * @returns Object containing language and additional parameters
 */
export const parseCodeBlockParameters = (
  text: string,
): {
  language: string;
  codeFenceParameters: string;
} => {
  const parsedText = /^ *([\w-]*)(.*)$/.exec(text);
  return {
    language: parsedText?.[1].trim() ?? "",
    codeFenceParameters: parsedText?.[2].trim() ?? "",
  };
};

/**
 * Creates a marked extension for custom think blocks
 * @returns MarkedExtension for rendering think blocks
 */
const thinkBlockFormatter = () => {
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
          `<details open class="p-2 -mb-2 text-sm bg-gray-50 dark:p-0 dark:bg-black rounded-lg">
            <summary class="cursor-pointer font-bold">Nachdenken</summary>
            <div class="italic p-1 text-gray-500">${token.text}</div>
          </details>`,
      },
    ],
  };
};

// Configure marked with extensions

marked.use(
  markedHighlight({
    emptyLangClass: "hljs",
    langPrefix: "hljs language-",
    highlight(code, lang, _) {
      if (lang === "mermaid") {
        return code;
      }
      const resolvedLang = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language: resolvedLang }).value;
    },
  }),
  markedKatex({
    throwOnError: false,
  }),
  thinkBlockFormatter() as MarkedExtension,
);

/**
 * Converts markdown string to HTML
 * @param markdown - The markdown string to convert
 * @returns HTML string
 */
const markdownToHtml = (markdown: string) => marked.parse(markdown);

/**
 * Finds CodeMirror language description by code block name for editor syntax highlighting
 * @param inputLanguageName - The language name from code block
 * @returns LanguageDescription or null if not found
 */
export const findLanguageByCodeBlockName = (inputLanguageName: string) => {
  const { language } = parseCodeBlockParameters(inputLanguageName);
  return (
    languages.find(
      (lang) =>
        lang.name.toLowerCase() === language.toLowerCase() ||
        lang.alias.some(
          (alias) => alias.toLowerCase() === language.toLowerCase(),
        ),
    ) || null
  );
};

/**
 * Extracts the first H1 title from a markdown string
 * @param markdown - The markdown string to extract title from
 * @returns The H1 title without the # prefix, or undefined if no H1 found
 */
export const extractH1Title = (markdown: string): string | undefined => {
  const match = markdown.match(/^# (.+)$/m);
  return match ? match[1].trim() : undefined;
};

export { markdownToHtml };
