import { navigate } from "astro:transitions/client";
import { createSignal } from "solid-js";

/**
 * SearchBar component for filtering items with URL state management
 * @param initial.search - Initial search value from URL params
 * @param initial.icon - Icon class for default state (default: "ti-search")
 * @param initial.placeholder - Placeholder text (default: "Durchsuchen ...")
 * @param initial.activeIcon - Icon class when focused (default: "ti-list-search")
 * @param initial.subtle - Whether to use a subtle style (default: false)
 * @returns SolidJS component that updates URL search params on Enter
 *
 * Sets the "search" URL parameter and triggers a page navigation when Enter is pressed.
 * Uses Astro's navigate() for smooth transitions without full page reload.
 */
const SearchBar = (initial: {
  search: string;
  icon?: string;
  placeholder?: string;
  activeIcon?: string;
  subtle?: boolean;
}) => {
  const [search, setSearch] = createSignal(initial.search);

  const searchItems = () => {
    const s = search();
    if (s === initial.search) return;

    const url = new URL(window.location.href);
    url.searchParams.set("search", s);
    navigate(url.toString(), { history: "replace" });
  };

  return (
    <>
      <div class="row group relative flex w-auto flex-1 gap-2">
        <div class="absolute inset-y-0 left-3 flex items-center text-gray-500">
          <i
            class={`${initial.icon || "ti ti-search"} group-focus-within:hidden`}
          ></i>
          <i
            class={`${initial.activeIcon || "ti ti-list-search"} hidden text-blue-500 group-focus-within:block`}
          ></i>
        </div>
        <input
          id="search-input"
          type="search"
          class={`${initial.subtle ? "input-subtle" : "input-border"} w-full p-2 pr-13 pl-9 ring-inset`}
          placeholder={initial.placeholder || "Durchsuchen ..."}
          value={search()}
          onInput={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") searchItems();
          }}
        />

        <div class="absolute inset-y-0 right-3 flex items-center">
          <kbd class="hidden font-mono text-xs text-gray-500 group-focus-within:block">
            Enter
          </kbd>
        </div>
      </div>
    </>
  );
};

export default SearchBar;
