import { languages } from "@codemirror/language-data";
import type { Extension } from "@codemirror/state";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";

// Import languages to support syntax highlighting
import "@codemirror/lang-python";
import "@codemirror/lang-sql";
import "@codemirror/lang-javascript";
import "@codemirror/lang-html";
import "@codemirror/lang-css";
import "@codemirror/lang-json";
import "@codemirror/lang-json";
import "@codemirror/lang-go";
import "@codemirror/lang-java";
import "@codemirror/lang-xml";
import "@codemirror/lang-yaml";
import "@codemirror/lang-rust";
import "@codemirror/lang-cpp";
import "@codemirror/lang-php";

/**
 * Parses the language name and additional parameters from a code block name input.
 * @param text - The text to parse from code fence
 * @returns Object containing language and additional parameters
 */
const parseCodeBlockParameters = (
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
 * Finds CodeMirror language description by code block name for editor syntax highlighting
 * @param inputLanguageName - The language name from code block
 * @returns LanguageDescription or null if not found
 */
const findLanguageByCodeBlockName = (inputLanguageName: string) => {
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
 * Markdown extension for CodeMirror 6 editor with support for syntax highlighting in code blocks
 */
export const markdownExtension: () => Extension = () =>
  markdown({
    base: markdownLanguage,
    codeLanguages: findLanguageByCodeBlockName,
  });
