import ContextMenu from "@/components/solidjs/ContextMenu";
import {
  createFuzzySearch,
  type SearchResult,
} from "@/lib/solidjs/fuzzy-search";
import {
  createLocalStoreQuery,
  deleteFromLocalStore,
  modifyLocalStore,
} from "@/lib/solidjs/localstorage";
import { dateTimeFormat } from "@/lib/utils/dates";
import { extractH1Title } from "@/lib/utils/markdown";
import { createSignal, For, Show } from "solid-js";
import type { MarkdownPad } from "./util";
import { PAD_STORAGE, padStorageId, padTitle } from "./util";
import { prompts } from "@/lib/client/prompt-lib";

/**
 * Renders a clickable pad card with context menu and optional search match highlights.
 */
const PadLink = ({
  pad,
  searchMatch,
}: {
  pad: MarkdownPad;
  searchMatch?: SearchResult<MarkdownPad>;
}) => {
  const padLink = `/tools/pad/${pad.id}`;

  const deleteFn = async () => {
    if (
      await prompts.confirm(
        `Möchtest du das Pad "${padTitle(pad)}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
        {
          icon: "ti ti-trash",
          title: "Pad löschen",
        },
      )
    ) {
      deleteFromLocalStore(padStorageId(pad), PAD_STORAGE);
    }
  };

  const renameFn = async () => {
    const newTitle = await prompts.prompt(
      "Gebe den neuen Titel für das Pad ein. Wenn kein Titel gesetzt wird, wird der Titel automatisch erstellt.",
      pad.title,
      {
        icon: "ti ti-pencil",
        title: "Pad umbenennen",
      },
    );
    if (newTitle === null) return;
    modifyLocalStore(
      padStorageId(pad),
      { ...pad, title: newTitle || undefined },
      PAD_STORAGE,
    );
  };

  return (
    <ContextMenu
      items={[
        {
          label: "Neues Pad erstellen",
          icon: <i class="ti ti-plus" />,
          onClick: () => window.open(`/tools/pad/new`),
        },
        {
          label: "In neuem Tab öffnen",
          icon: <i class="ti ti-arrow-up-right" />,
          onClick: () => window.open(padLink, "_blank"),
        },
        {
          label: "Inhalt kopieren",
          icon: <i class="ti ti-clipboard" />,
          onClick: () => navigator.clipboard.writeText(pad.content),
        },
        {
          label: pad.pinned ? "Entpinnen" : "Anpinnen",
          icon: <i class={`ti ${pad.pinned ? "ti-pinned-off" : "ti-pin"}`} />,
          onClick: () =>
            modifyLocalStore(
              padStorageId(pad),
              { ...pad, pinned: !pad.pinned },
              PAD_STORAGE,
            ),
        },
        {
          label: "Umbenennen",
          icon: <i class="ti ti-pencil" />,
          onClick: renameFn,
        },
        {
          label: "Löschen",
          icon: <i class="ti ti-trash text-red-500" />,
          onClick: deleteFn,
        },
      ]}
      class={`group sm:paper relative py-2 sm:p-2`}
    >
      <a href={padLink}>
        <Show
          when={searchMatch}
          fallback={
            <div class="absolute top-2 right-2 z-10 text-xs group-hover:text-blue-500 dark:group-hover:text-gray-200">
              <div class="relative">
                <i
                  class={`ti ti-pin group-hover:hidden ${!pad.pinned && "hidden"}`}
                />
                <i class="ti ti-arrow-up-right hidden group-hover:block" />
              </div>
            </div>
          }
        >
          <div class="absolute top-2 right-2 z-10 text-xs opacity-0 transition-all ease-in group-hover:text-blue-500 group-hover:opacity-100 dark:group-hover:text-gray-200">
            <i class="ti ti-search mr-1"></i>
            <span class="text-[10px]">
              Score: {searchMatch?.score?.toFixed(2)}
            </span>
          </div>
        </Show>

        <h3 class="ellipsis font-bold group-hover:font-extrabold">
          {pad.title || extractH1Title(pad.content) || "Untitled"}
        </h3>
        <small>{dateTimeFormat(pad.updated)}</small>

        <Show when={(searchMatch?.matches?.length ?? 0) > 0}>
          <small class="text-xs opacity-60">
            <div class="truncate">
              <i class={`ti ti-search me-1 font-semibold`} />
              <span class="italic">
                {searchMatch?.matches?.[0]?.value?.substring(0, 30)}
              </span>
            </div>
          </small>
        </Show>
      </a>
    </ContextMenu>
  );
};

/**
 * Main pad index page with fuzzy search and grid layout.
 * Shows all pads with search functionality and context menus.
 */
const PadIndex = () => {
  const [searchTerm, setSearchTerm] = createSignal("");

  // Load all pads from localStorage
  const [pads] = createLocalStoreQuery<MarkdownPad>(
    (key) => key.startsWith("pad:") && key !== "pad:settings",
    {
      enhanceRecord: (pad) => ({
        ...pad,
        title: pad.title || extractH1Title(pad.content) || "Untitled",
      }),
    },
  );

  if (pads.length === 0) {
    return (
      <div class="flex h-full w-full flex-1 items-center justify-center">
        <a class="btn-simple" href="/tools/pad/new">
          <i class="ti ti-plus"></i>
          <span>Erstes Pad erstellen</span>
        </a>
      </div>
    );
  }

  // Fuzzy search with pinned-first sorting
  const searchResults = createFuzzySearch(searchTerm, () => pads, {
    keys: [
      { name: "title", weight: 0.7 },
      { name: "content", weight: 0.3 },
    ],
    threshold: 0.4,
    ignoreLocation: true,
    defaultSort: (a, b) => {
      // Pinned
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      // Sort by date (newest first)
      return b.updated.getTime() - a.updated.getTime();
    },
  });

  return (
    <div class="flex flex-col items-center gap-4 p-4 sm:p-10">
      <h2 class="text-2xl font-bold">Pads</h2>

      <div class="flex min-w-full flex-row gap-2 md:min-w-[60%] lg:min-w-[40%]">
        <input
          id="pad-search-input"
          type="text"
          class="input-subtle flex-1"
          placeholder="Suchen..."
          value={searchTerm()}
          onInput={(e) => {
            setSearchTerm(e.currentTarget.value);
          }}
        />

        <a
          aria-label="create new pad"
          class="btn-subtle group/btn px-3 py-2"
          href="/tools/pad/new"
        >
          <i class={`ti ti-plus group-hover/btn:hidden`} />
          <i class={`ti ti-thumb-up hidden group-hover/btn:inline`} />
        </a>
      </div>

      <Show
        when={searchResults().length === 0 && searchTerm().trim().length >= 2}
      >
        <p class="text-xs text-gray-500">
          <i class="ti ti-mood-sad mr-1"></i>
          <span>Nicht gefunden</span>
        </p>
      </Show>

      <div class="grid w-full grid-cols-1 divide-y divide-gray-200 sm:gap-4 sm:divide-y-0 md:grid-cols-3 lg:grid-cols-5 dark:divide-gray-800">
        <For each={searchResults()}>
          {(result) => (
            <PadLink
              pad={result.item}
              searchMatch={result.matches ? result : undefined}
            />
          )}
        </For>
      </div>
    </div>
  );
};

export default PadIndex;
