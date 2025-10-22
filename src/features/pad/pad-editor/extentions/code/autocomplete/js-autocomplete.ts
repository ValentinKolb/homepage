/**
 * JavaScript Autocomplete for CodeMirror
 *
 * Provides built-in JavaScript completions including:
 * - JavaScript standard library (Array, Object, Promise, etc.)
 * - Browser APIs (document, window, fetch, etc.)
 * - Local variables and properties
 */

import { javascriptLanguage } from "@codemirror/lang-javascript";
import { scopeCompletionSource } from "@codemirror/lang-javascript";

/**
 * Creates the JavaScript autocomplete extension
 * @returns CodeMirror extension with JavaScript-specific completions
 */
export const jsAutocomplete = () => {
  return javascriptLanguage.data.of({
    autocomplete: scopeCompletionSource(globalThis),
  });
};
