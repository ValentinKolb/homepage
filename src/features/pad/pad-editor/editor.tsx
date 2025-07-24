import CopyButton from "@/components/core/CopyButton";
import Tooltip from "@/components/core/Tooltip";
import { downloadFileFromContent } from "@/lib/client/files";
import { findLanguageByCodeBlockName } from "@/lib/utils/markdown-util";
import { autocompletion, closeBrackets } from "@codemirror/autocomplete";
import { indentWithTab } from "@codemirror/commands";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { bracketMatching } from "@codemirror/language";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { githubDarkInit, githubLightInit } from "@uiw/codemirror-theme-github";
import { basicSetup } from "codemirror";
import { createCodeMirror } from "solid-codemirror";
import { For, Show } from "solid-js";
import type { SetStoreFunction } from "solid-js/store";
import {
  createPadSettings,
  createTheme,
  padTitle,
  type MarkdownPad,
} from "../util";
import { createPadManager } from "./collab";

/**
 * Custom theme configuration for CodeMirror editor.
 * Provides consistent styling across light/dark themes with transparent backgrounds
 * and custom cursor styling for collaborative editing.
 */
const themeOverwrites = EditorView.theme({
  "&": {
    height: "100%",
    overflow: "hidden",
    flex: 1,
  },
  "&.cm-editor.cm-focused": {
    outline: "none",
  },
  ".dark &.cm-editor.cm-focused": {
    outline: "none",
  },
  ".cm-scroller": { overflow: "auto", minHeight: "100%" },
  ".cm-gutters": {
    backgroundColor: "transparent",
    border: "none",
  },
  ".cm-gutterElement": {
    color: "oklch(55.1% 0.027 264.364)",
  },
  ".cm-foldPlaceholder": {
    backgroundColor: "transparent",
    border: "none",
  },
  "&:not(.cm-focused) .cm-activeLine": {
    backgroundColor: "transparent",
  },
  "&:not(.cm-focused) .cm-activeLineGutter": {
    backgroundColor: "transparent",
  },
  ".cm-cursor, .loro-cursor": {
    borderLeftWidth: "2px",
  },
  ".loro-cursor::before": {
    background: "oklch(92.8% 0.006 264.531)",
    borderRadius: "var(--radius-md)",
  },
  ".cm-cursor-primary": {
    borderLeftWidth: "2px",
    borderLeftColor: "oklch(62.3% 0.214 259.815)",
  },
});

/**
 * Collaborative markdown editor with real-time synchronization.
 *
 * Features:
 * - CodeMirror-based editing with markdown syntax highlighting
 * - Real-time collaboration via Loro CRDT
 * - User presence indicators and cursor tracking
 * - Copy/download functionality
 * - Theme-aware styling (light/dark mode)
 *
 * @param pad - The markdown pad data to edit
 * @param setPad - Function to update the pad state
 */
const Editor = ({
  pad,
  setPad,
}: {
  pad: MarkdownPad;
  setPad: SetStoreFunction<MarkdownPad>;
}) => {
  const colorTheme = createTheme();
  const [settings, setSettings] = createPadSettings();

  // Generate filename from pad title for downloads
  const filename = () => `${padTitle(pad).replace(/\s+/g, "-")}.md`;

  const { ref: editorRef, createExtension } = createCodeMirror();

  // Setup collaborative editing with real-time sync and user presence
  const { users, loroExtention } = createPadManager(pad, setPad);

  // Enable collaborative editing with Loro CRDT
  createExtension(loroExtention());

  // Configure core editor functionality
  createExtension(basicSetup);
  createExtension(keymap.of([indentWithTab]));
  createExtension(lineNumbers());
  createExtension(bracketMatching());
  createExtension(closeBrackets());
  createExtension(EditorView.lineWrapping);
  createExtension(autocompletion());

  // Enable markdown syntax highlighting with code block support
  createExtension(
    markdown({
      base: markdownLanguage,
      codeLanguages: findLanguageByCodeBlockName,
    }),
  );

  // Apply dynamic theming based on user preference
  const themeSettings = { settings: { fontFamily: "monospace" } };
  createExtension(themeOverwrites);
  createExtension(() =>
    colorTheme() === "dark"
      ? githubDarkInit(themeSettings)
      : githubLightInit(themeSettings),
  );

  return (
    <div
      class={`m-1 flex flex-1 flex-col overflow-hidden rounded border border-gray-200 dark:border-gray-700 print:hidden`}
    >
      <div class="flex-1 overflow-hidden" ref={editorRef} />
      <div class="flex w-full items-center gap-2 border-t border-gray-200 p-1 font-mono text-xs dark:border-gray-700">
        <span class="text-dimmed min-w-0 flex-1 truncate">{filename()}</span>

        <Show when={users().length > 1}>
          <div class="group">
            <Tooltip
              label={
                <div class="flex flex-col gap-1">
                  <ul>
                    <For each={users()}>
                      {(user) => (
                        <li class="before:mr-1 before:content-['•']">{user}</li>
                      )}
                    </For>
                  </ul>
                  <p class="text-dimmed text-xs italic">
                    Klicken um Namen zu ändern
                  </p>
                </div>
              }
            >
              <button
                class="text-dimmed relative inline-flex items-center gap-1"
                onClick={() => {
                  const newName = prompt(
                    "Anzeigename\nDiesen Namen sehen andere Personen wenn du mit ihnen zusammenarbeitest",
                    settings.name,
                  );
                  newName && setSettings({ name: newName });
                }}
              >
                {/* Icons change on hover to indicate edit functionality */}
                <i class="ti ti-users group-hover:hidden"></i>

                <i class="ti ti-user-edit hidden text-blue-500 group-hover:block"></i>
                {users().length}
              </button>
            </Tooltip>
          </div>
        </Show>

        <Tooltip label="Kopieren">
          <CopyButton>
            {({ copy, wasCopied }) => (
              <button
                aria-label="Copy to Clipboard"
                onClick={() => copy(pad.content)}
              >
                <i class={`ti ${wasCopied() ? "ti-check" : "ti-clipboard"}`} />
              </button>
            )}
          </CopyButton>
        </Tooltip>
        <Tooltip
          label={
            <span>
              Als <code>.md</code> herunterladen
            </span>
          }
        >
          <button
            class="flex-shrink-0"
            aria-label="Download markdown file"
            onClick={() => downloadFileFromContent(pad.content, filename())}
          >
            <i class={`ti ti-download`} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

export default Editor;
