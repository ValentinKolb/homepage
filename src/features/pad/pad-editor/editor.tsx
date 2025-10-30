import CopyButton from "@/components/solidjs/CopyButton";
import Tooltip from "@/components/solidjs/Tooltip";
import { downloadFileFromContent } from "@/lib/client/files";
import { createTheme } from "@/lib/solidjs/color-theme";
import { autocompletion } from "@codemirror/autocomplete";
import { foldGutter } from "@codemirror/language";
import { lineNumbers } from "@codemirror/view";
import { createCodeMirror, createEditorReadonly } from "solid-codemirror";
import { For, Show, createEffect, onCleanup, onMount } from "solid-js";
import type { SetStoreFunction } from "solid-js/store";
import { padTitle, type MarkdownPad } from "../util";
import { createPadManager } from "./collab";
import howtoText from "./howto.md?raw";

import {
  markdownExtension,
  basicExtensions,
  codeExtension,
  customDarkInit,
  customLightInit,
  listsExtension,
  imageExtension,
  katexExtension,
  mermaidExtension,
  searchTheme,
  tablesExtension,
  emojiExtension,
  infoBlocksExtension,
  linksExtension,
} from "./extentions";
import { prompts } from "@/lib/client/prompt-lib";

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
  howto,
  username,
  localData,
}: {
  pad: MarkdownPad;
  setPad: SetStoreFunction<MarkdownPad>;
  howto: boolean;
  username: string | undefined;
  localData?: Uint8Array;
}) => {
  const colorTheme = createTheme();

  // Generate filename from pad title for downloads
  const filename = () =>
    howto ? "HowTo" : `${padTitle(pad).replace(/\s+/g, "-")}.md`;

  const {
    ref: editorRef,
    createExtension,
    editorView,
  } = createCodeMirror({
    value: howto ? howtoText : undefined,
  });

  createEditorReadonly(editorView, () => !!pad?.lockEditing);

  // Auto-focus editor when it's ready
  createEffect(() => {
    const view = editorView();
    if (view && !view.hasFocus && pad.content.length === 0) {
      view.focus();
    }
  });

  // Setup collaborative editing with real-time sync and user presence
  const { users, loroExtention } = createPadManager({
    pad,
    setPad,
    localData,
    username,
  });

  // Enable collaborative editing with Loro CRDT (not for howto page)
  createExtension(() => (howto ? [] : loroExtention()));

  // Configure core editor functionality
  createExtension(basicExtensions());
  createExtension(autocompletion());

  // Enable markdown syntax highlighting with code block support
  createExtension(markdownExtension());

  // Custom extensions
  createExtension(searchTheme());

  // Enable code execution
  createExtension(() => (pad?.enableCodeExecution ? codeExtension() : []));

  // Enable cuatom formatting extensions
  createExtension(() => [
    tablesExtension(),
    katexExtension(),
    mermaidExtension(),
    emojiExtension(),
    imageExtension(),
    listsExtension(),
    infoBlocksExtension(),
    linksExtension(),
  ]);

  // Only show gutter if enabled
  createExtension(() =>
    pad?.enableGutter ? [lineNumbers(), foldGutter()] : [],
  );

  // Apply dynamic theming based on user preference
  createExtension(() =>
    colorTheme() === "dark" ? customDarkInit() : customLightInit(),
  );

  const handleSave = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
      e.preventDefault();
      prompts.alert(
        howto
          ? "Das 'HowTo' Pad wird automatisch beim Reload der Seite zurückgesetzt. Alle anderen Pads werden automatisch gespeichert."
          : "Das Pad wird automatisch alle fünf Sekunden gespeichert. Um den Inhalt herunterzuladen, nutze den Download-Button in der unteren rechten Ecke.",
      );
    }
  };
  onMount(() => document.addEventListener("keydown", handleSave));
  onCleanup(() => document.removeEventListener("keydown", handleSave));

  return (
    <div class={`flex h-full w-full flex-1 flex-col overflow-hidden rounded`}>
      <div class="flex flex-1 overflow-hidden" ref={editorRef} />
      <div class="m-1 mt-0 flex items-center gap-2 p-1 font-mono text-xs">
        <span class="text-dimmed min-w-0 flex-1 truncate">{filename()}</span>

        <Show when={!howto}>
          <div class="inline-flex items-center gap-1 rounded px-1 ring ring-gray-200 dark:ring-gray-700">
            <Tooltip
              label={
                <div class="flex flex-col gap-1">
                  <p class="text-dimmed text-xs">
                    <i class="ti ti-lock mr-1" />
                    Das Pad ist Ende zu Ende verschlüsselt!
                  </p>
                  <hr class="border-gray-700" />
                  <p>
                    <i class="ti ti-users mr-1"></i> Online:
                  </p>
                  <ul>
                    <For each={users().slice(0, 5)}>
                      {(user) => (
                        <li class="flex items-center before:mr-1 before:flex-shrink-0 before:content-['•']">
                          <span class="min-w-0 truncate">{user.name}</span>
                          {user.self && (
                            <span class="text-dimmed ml-1 flex-shrink-0">
                              (Du)
                            </span>
                          )}
                        </li>
                      )}
                    </For>
                    {users().length > 5 && (
                      <li class="before:mr-1 before:content-['•']">
                        +{users().length - 5} weitere
                      </li>
                    )}
                  </ul>
                  {!username && (
                    <>
                      <hr class="border-gray-700" />
                      <p class="text-dimmed text-xs italic">
                        Melde dich an um deinen Namen zu ändern
                      </p>
                    </>
                  )}
                </div>
              }
            >
              <div
                class={`group text-dimmed relative inline-flex items-center gap-1`}
              >
                <span class="text-xs">{users().length}</span>
                <i
                  class={`ti hover:text-blue-500 ${users().length > 1 ? "ti-users" : "ti-user"}`}
                />
              </div>
            </Tooltip>

            <Tooltip label="Teilen">
              <CopyButton>
                {({ copy, wasCopied }) => (
                  <button
                    aria-label="Copy to Clipboard"
                    onClick={() =>
                      copy(window.location.href).then(() =>
                        prompts.alert(
                          "Der Link wurde in die Zwischenablage kopiert.",
                        ),
                      )
                    }
                  >
                    <i class={`ti ${wasCopied() ? "ti-check" : "ti-send"}`} />
                  </button>
                )}
              </CopyButton>
            </Tooltip>
          </div>
        </Show>

        <Tooltip
          label={
            pad?.lockEditing ? (
              <>
                Bearbeiten ist bei dir{" "}
                <span class="text-red-400">gesperrt</span>.
                <br />
                Andere können das Pad weiterhin bearbeiten.
              </>
            ) : (
              <>
                Bearbeiten <span class="text-green-500">aktiviert</span>.
                <br />
                Klicke um bearbeiten bei dir zu sperren.
              </>
            )
          }
        >
          <button
            aria-label="Toggle code execution activation"
            onClick={() =>
              setPad({
                ...pad,
                lockEditing: !pad?.lockEditing,
              })
            }
          >
            <i
              class={`ti ${pad?.lockEditing ? "ti-pencil-off text-red-500" : "ti-pencil"}`}
            />
          </button>
        </Tooltip>

        <Tooltip
          label={`Codeausführung ${pad?.enableCodeExecution ? "deaktivieren" : "aktivieren"}`}
        >
          <button
            aria-label="Toggle code execution activation"
            onClick={() =>
              setPad({
                ...pad,
                enableCodeExecution: !pad?.enableCodeExecution,
              })
            }
          >
            <i
              class={`ti ti-player-play ${pad?.enableCodeExecution ? "" : "opacity-40"}`}
            />
          </button>
        </Tooltip>

        <Tooltip
          label={`Zeilenzahlen ${pad?.enableGutter ? "ausblenden" : "anzeigen"}`}
        >
          <button
            aria-label="Show line numbers"
            onClick={() =>
              setPad({
                ...pad,
                enableGutter: !pad?.enableGutter,
              })
            }
          >
            <i
              class={`ti ti-list-numbers ${pad?.enableGutter ? "" : "opacity-40"}`}
            />
          </button>
        </Tooltip>

        <Tooltip label="Inhalt kopieren">
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
              Inhalt als <code>.md</code> Datei herunterladen
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
