import superjson from "superjson";

/**
 * Utility type to make all properties of T optional and potentially undefined
 */
type MakeOptionalUndefined<T> = {
  [K in keyof T]?: T[K] | undefined;
};

/**
 * Checks if a value is a simple primitive that can be serialized directly
 */
const isPrimitive = (value: any): boolean =>
  typeof value === "string" ||
  typeof value === "number" ||
  typeof value === "boolean";

/**
 * Checks if a value should be removed from search parameters
 * Returns true for undefined, null, false, or empty string
 */
const shouldRemoveParam = (value: any): boolean =>
  value === undefined || value === null || value === false || value === "";

/**
 * Deserializes search parameters from URLSearchParams or browser location.
 * Attempts to parse values as primitives first, then uses superjson for complex objects.
 */
export const deserializeSearchParams = <T extends Record<string, any>>(
  searchParams?: URLSearchParams,
): MakeOptionalUndefined<T> => {
  const params =
    searchParams || new URLSearchParams(globalThis?.location?.search || "");
  const result: any = {};

  for (const [key, value] of params) {
    // Parse primitive values first
    if (value === "true") {
      result[key] = true;
    } else if (value === "false") {
      result[key] = false;
    } else if (!isNaN(Number(value)) && value !== "") {
      result[key] = Number(value);
    } else {
      // Try superjson parsing for complex objects
      try {
        result[key] = superjson.parse(value);
      } catch {
        // Fallback to string if parsing fails
        result[key] = value;
      }
    }
  }

  return result;
};

/**
 * Serializes search parameters to a URL search string.
 * Uses direct string conversion for primitives and superjson for complex objects.
 * Removes parameters with falsy values (undefined, null, false, empty string).
 */
export const serializeSearchParams = <T extends Record<string, any>>(
  newParams: MakeOptionalUndefined<T>,
  searchParams?: URLSearchParams,
): string => {
  const current = new URLSearchParams(
    searchParams || globalThis?.location?.search || "",
  );

  for (const [key, value] of Object.entries(newParams)) {
    if (shouldRemoveParam(value)) {
      // Remove parameter if value is falsy
      current.delete(key);
    } else if (isPrimitive(value)) {
      // Direct string conversion for primitives
      current.set(key, String(value));
    } else {
      // Use superjson for complex objects
      current.set(key, superjson.stringify(value));
    }
  }

  return current.toString();
};

/**
 * Sets up a listener for search parameter changes in the browser.
 * Useful for reactive frameworks like Solid.js signals.
 */
export const onSearchParamsChange = <T extends Record<string, any>>(
  callback: (params: MakeOptionalUndefined<T>) => void,
): (() => void) => {
  // Only works in browser environment
  if (typeof window === "undefined") {
    return () => {};
  }

  const handlePopState = () => {
    const params = deserializeSearchParams<T>();
    callback(params);
  };

  // Listen for browser back/forward navigation
  window.addEventListener("popstate", handlePopState);

  // Return cleanup function
  return () => {
    window.removeEventListener("popstate", handlePopState);
  };
};
