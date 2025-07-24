import ContextMenu from "@/components/core/ContextMenu";
import Tooltip from "@/components/core/Tooltip";
import {
  createFuzzySearch,
  type SearchResult,
} from "@/lib/solidjs/fuzzy-search";
import {
  createLocalStoreQuery,
  deleteFromLocalStore,
  modifyLocalStore,
} from "@/lib/solidjs/localstorage";
import { dateTimeFormat } from "@/lib/utils/dateFormat";
import { extractH1Title } from "@/lib/utils/markdown-util";
import { createSignal, For, Show } from "solid-js";
import type { MarkdownPad } from "./util";
import { PAD_STORAGE, padStorageId } from "./util";

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

  const deleteFn = () => {
    deleteFromLocalStore(padStorageId(pad), PAD_STORAGE);
  };

  const renameFn = () => {
    const newTitle = prompt("Neuer Pad Titel", pad.title);
    if (!newTitle) return;
    modifyLocalStore(
      padStorageId(pad),
      { ...pad, title: newTitle },
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
      class={(isOpen) =>
        `hover-shadow group relative p-2 ${isOpen ? "paper-highlighted" : "paper"}`
      }
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

        <h3 class="ellipsis font-bold">
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
    <div class="flex flex-col items-center gap-4 p-10">
      <h2 class="text-2xl font-bold">Pads</h2>

      <div class="flex min-w-full flex-row gap-2 md:min-w-[60%] lg:min-w-[40%]">
        <input
          id="pad-search-input"
          type="text"
          class="input-simple flex-1"
          placeholder="Suchen..."
          value={searchTerm()}
          onInput={(e) => {
            setSearchTerm(e.currentTarget.value);
          }}
        />

        <Tooltip label="Neues Pad">
          <a
            aria-label="create new pad"
            class="icon-btn aspect-square h-full"
            href="/tools/pad/new"
          >
            <i class={`ti ti-plus`} />
          </a>
        </Tooltip>
      </div>

      <Show
        when={searchResults().length === 0 && searchTerm().trim().length >= 2}
      >
        <p class="text-xs text-gray-500">
          <i class="ti ti-mood-sad mr-1"></i>
          <span>Nicht gefunden</span>
        </p>
      </Show>

      <div class="grid w-full grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
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
