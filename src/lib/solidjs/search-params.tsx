import { createMemo, onCleanup } from "solid-js";
import { map } from "nanostores";
import { useStore } from "@nanostores/solid";

// Store all query parameters as a Nano Store Map
export const queryParamsStore = map(
  new URLSearchParams(window.location.search),
);

/**
 * Updates the Nano Store whenever the URL changes (e.g., back/forward navigation).
 */
const updateQueryParams = () => {
  queryParamsStore.set(new URLSearchParams(window.location.search));
};

// Listen for browser navigation events (popstate)
window.addEventListener("popstate", updateQueryParams);
onCleanup(() => window.removeEventListener("popstate", updateQueryParams));

type QueryParamOptions = {
  historyMode?: "replace" | "push"; // Determines if history state is replaced or pushed
};

/**
 * A SolidJS hook to synchronize a single query parameter with Nano Stores.
 * - Works across multiple components.
 * - Supports optional value transformation.
 * - Can push or replace history state.
 *
 * @param key - The query parameter key.
 * @param valueTransform - Optional function to transform the retrieved value.
 * @param valueSerializer - Function to convert the value to a string before setting it.
 * @param options - Configuration options for history state.
 * @returns A tuple [value, setValue].
 */
export default function useQueryParam<T = string>(
  key: string,
  valueTransform?: (value: string | null) => T,
  valueSerializer: (value: T) => string = (value) => String(value),
  options: QueryParamOptions = { historyMode: "replace" },
): [() => T | null, (value: T | null) => void] {
  // Get current value from Nano Store
  const queryParams = useStore(queryParamsStore);

  // Create a reactive memoized value
  const value = createMemo(() => {
    const rawValue = queryParams().get(key) || null;
    if (rawValue === null) return null;
    return valueTransform ? valueTransform(rawValue) : (rawValue as T | null);
  });

  /**
   * Updates the query parameter in both the URL and the Nano Store.
   * - Removes the parameter if `newValue` is falsy (`null`, `undefined`, `""`, `false`).
   * - Replaces or pushes history state based on options.
   */
  const setQueryParam = (newValue: T | null) => {
    const params = new URLSearchParams(window.location.search);

    if (newValue === null || newValue === undefined || newValue === "") {
      params.delete(key); // Remove the parameter
    } else {
      params.set(key, valueSerializer(newValue)); // Convert to string and update
    }

    const newUrl = `?${params.toString()}`;
    if (options.historyMode === "replace") {
      window.history.replaceState(null, "", newUrl);
    } else {
      window.history.pushState(null, "", newUrl);
    }

    // Update the Nano Store with the new query parameters
    queryParamsStore.set(params);
  };

  return [value, setQueryParam];
}
