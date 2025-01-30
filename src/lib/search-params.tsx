import { map } from "nanostores";
import { useStore } from "@nanostores/react";
import { useCallback } from "react";

// Store all query parameters as a Nano Store Map
export const queryParamsStore = map(
  new URLSearchParams(window.location.search),
);

// Function to update the store whenever the URL changes
const updateQueryParams = () => {
  queryParamsStore.set(new URLSearchParams(window.location.search));
};

// Listen for browser navigation events (back/forward)
window.addEventListener("popstate", updateQueryParams);

// Define options type
type QueryParamOptions = {
  historyMode?: "replace" | "push"; // Determines if history state is replaced or pushed
};

/**
 * A React hook to synchronize a single query parameter with Nano Stores.
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
function useQueryParam<T = string>(
  key: string,
  valueTransform?: (value: string | null) => T,
  valueSerializer: (value: T) => string = (value) => value.toString(),
  options: QueryParamOptions = { historyMode: "replace" },
): [T | null, (value: T | null) => void] {
  // Get the current value from the Nano Store
  const queryParams = useStore(queryParamsStore);
  const rawValue = queryParams.get(key) || null;
  const value = valueTransform
    ? valueTransform(rawValue)
    : (rawValue as T | null);

  /**
   * Updates the query parameter in both the URL and Nano Store.
   * - Removes the parameter if `newValue` is falsy (`null`, `undefined`, `""`, `false`).
   * - Replaces or pushes history state based on options.
   */
  const setQueryParam = useCallback(
    (newValue: T | null) => {
      const params = new URLSearchParams(window.location.search);

      if (!newValue) {
        params.delete(key); // Remove the parameter if falsy
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
    },
    [key, valueSerializer, options.historyMode],
  );

  return [value, setQueryParam];
}

export default useQueryParam;
