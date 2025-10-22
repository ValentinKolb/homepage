import { onCleanup } from "solid-js";
import { type Store, type SetStoreFunction, createStore } from "solid-js/store";
import superjson from "superjson";

/**
 * # Sync Model
 *
 * This system provides synchronization across same-tab and cross-tab contexts:
 *
 * **Same-tab**: Direct in-memory value passing via listener system
 * **Cross-tab**: BroadcastChannel messages trigger localStorage reload in target tabs
 * **Race condition prevention**: Micro-delay ensures localStorage commits before cross-tab notifications
 *
 * All stores and queries with matching keys/filters automatically stay synchronized.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Represents an item stored in localStorage with an associated key.
 *
 * @template T - The type of the stored data.
 */
type StoreItem<T> = T & { _key: string };

/**
 * Options for configuring local store query behavior.
 *
 * @template T - The type of data stored in localStorage items.
 */
interface LocalStoreQueryOptions<T extends Record<string, any>> {
  /**
   * Storage instance to use for reading/writing data.
   * @default localStorage
   */
  storage?: Storage;

  /**
   * Optional function to enhance each record after loading from storage.
   * Useful for adding computed properties or transforming data.
   */
  enhanceRecord?: (item: StoreItem<T>) => StoreItem<T>;
}

/**
 * Return type for createLocalStore function.
 *
 * @template T - The type of the stored data.
 */
type CreateLocalStoreResult<T extends Record<string, any>> = [
  Store<StoreItem<T>>,
  SetStoreFunction<StoreItem<T>>,
];

/**
 * Return type for createLocalStoreQuery function.
 *
 * @template T - The type of the stored data.
 */
type CreateLocalStoreQueryResult<T extends Record<string, any>> = [
  Store<StoreItem<T>[]>,
  () => void,
];

/**
 * Type for listener callback functions.
 */
type ListenerCallback = (key: string, value?: any) => void;

/**
 * Type for key filter functions used in queries.
 */
type KeyFilter = (key: string) => boolean;

// ============================================================================
// INTERNAL SYNCHRONIZATION SYSTEM
// ============================================================================

// Global BroadcastChannel for cross-tab synchronization
const globalChannel = new BroadcastChannel("localstorage-sync");

const listeners = new Map<string | Function, Set<ListenerCallback>>();

/**
 * Subscribe to store changes for a specific key or filter function.
 *
 * @param keyOrFilter - Specific key string or filter function for multiple keys
 * @param callback - Function called when matching stores change
 * @returns Unsubscribe function
 */
const subscribe = (
  keyOrFilter: string | KeyFilter,
  callback: ListenerCallback,
): (() => void) => {
  if (!listeners.has(keyOrFilter)) listeners.set(keyOrFilter, new Set());
  listeners.get(keyOrFilter)!.add(callback);

  return () => listeners.get(keyOrFilter)?.delete(callback);
};

/**
 * Notify all subscribers of a store change.
 *
 * @param key - The store key that changed
 * @param value - The new value (undefined for cross-tab reload, null for deletion)
 * @param __fromBroadcast - Internal flag to prevent broadcast loops
 */
const notify = (key: string, value?: any, __fromBroadcast = false): void => {
  // Notify exact key matches (for stores)
  listeners.get(key)?.forEach((callback) => callback(key, value));

  // Notify filter matches (for queries)
  listeners.forEach((callbacks, keyOrFilter) => {
    if (typeof keyOrFilter === "function" && keyOrFilter(key)) {
      callbacks.forEach((callback) => callback(key, value));
    }
  });

  if (!__fromBroadcast) {
    setTimeout(() => globalChannel.postMessage({ key }), 0);
  }
};

// Listen for cross-tab updates and forward to unified system
globalChannel.addEventListener("message", (event) => {
  const { key } = event.data;
  notify(key, undefined, true); // Flag prevents recursive broadcast
});

// ============================================================================
// PUBLIC API FUNCTIONS
// ============================================================================

/**
 * Creates a reactive store with automatic localStorage persistence and cross-tab sync.
 *
 * @template T - The type of data to store (must be a record/object).
 * @param key - Unique localStorage key for this store.
 * @param defaultValue - Default value when storage is empty or invalid.
 * @param storage - Storage instance to use (defaults to localStorage).
 * @returns A tuple containing [store, setStore] where store is reactive and setStore persists changes.
 *
 * @example
 * ```tsx
 * const [user, setUser] = createLocalStore("user", { name: "", email: "" });
 * setUser("name", "John"); // Automatically syncs across tabs
 * ```
 */
const createLocalStore = <T extends Record<string, any>>(
  key: string,
  defaultValue: T,
  storage: Storage = localStorage,
): CreateLocalStoreResult<T> => {
  const getInitialValue = (): StoreItem<T> => {
    try {
      const stored = storage.getItem(key);
      return stored
        ? (superjson.parse(stored) as StoreItem<T>)
        : { ...defaultValue, _key: key };
    } catch {
      return { ...defaultValue, _key: key };
    }
  };

  const [store, _setStore] = createStore<StoreItem<T>>(getInitialValue());

  // Subscribe to same-tab and cross-tab changes
  const unsubscribe = subscribe(key, (_, value?: any) => {
    if (value === null) {
      _setStore({ ...defaultValue, _key: key });
    } else if (value) {
      _setStore(value);
    } else {
      // Cross-tab - reload from storage
      const newValue = getInitialValue();
      _setStore(newValue);
    }
  });
  onCleanup(unsubscribe);

  // Wrapped setStore with localStorage write and notifications
  const setStore: SetStoreFunction<StoreItem<T>> = (...args: any) => {
    const result = (_setStore as any)(...args);

    try {
      storage.setItem(key, superjson.stringify(store));
    } catch (error) {
      console.warn(`Failed to store ${key}:`, error);
      return result;
    }

    notify(key, store);
    return result;
  };

  return [store, setStore];
};

/**
 * Creates a reactive query that watches multiple localStorage keys.
 *
 * @template T - The type of data stored in localStorage items.
 * @param keysFilter - Optional function to filter which keys to include. If not provided, includes all keys.
 * @param options - Configuration options for storage and record enhancement.
 * @returns A tuple containing [stores, reload] where stores is a reactive array and reload manually refreshes the data.
 *
 * @example
 * ```tsx
 * const [pads] = createLocalStoreQuery(key => key.startsWith("pad:"));
 * ```
 */
const createLocalStoreQuery = <T extends Record<string, any>>(
  keysFilter?: KeyFilter,
  options: LocalStoreQueryOptions<T> = {},
): CreateLocalStoreQueryResult<T> => {
  const { storage = localStorage, enhanceRecord } = options;

  const loadStores = (): StoreItem<T>[] => {
    return Object.keys(storage)
      .filter((key) => (keysFilter ? keysFilter(key) : true))
      .map((key) => {
        try {
          const stored = storage.getItem(key);
          if (!stored) return null;

          const parsed = superjson.parse(stored) as T;
          const item = { ...parsed, _key: key };
          return enhanceRecord ? enhanceRecord(item) : item;
        } catch (error) {
          console.warn(`Failed to parse ${key}:`, error);
          return null;
        }
      })
      .filter((item) => item !== null);
  };

  const [stores, setStores] =
    createStore<Array<T & { _key: string }>>(loadStores());

  const reload = () => setStores(loadStores());

  const unsubscribe = subscribe(keysFilter || (() => true), () => reload());
  onCleanup(unsubscribe);

  return [stores, reload];
};

/**
 * Deletes a key from localStorage and notifies all stores/queries.
 *
 * @param key - The localStorage key to delete.
 * @param storage - Storage instance to use (defaults to localStorage).
 */
const deleteFromLocalStore = (
  key: string,
  storage: Storage = localStorage,
): void => {
  storage.removeItem(key);
  notify(key, null);
};

/**
 * Directly modifies a localStorage key and notifies all stores/queries.
 *
 * @template T - The type of data to store.
 * @param key - The localStorage key to modify.
 * @param value - The new value to store.
 * @param storage - Storage instance to use (defaults to localStorage).
 */
const modifyLocalStore = <T extends Record<string, any>>(
  key: string,
  value: T | ((prev?: T) => T),
  storage: Storage = localStorage,
): void => {
  if (typeof value === "function")
    value = value(readFromLocalStorage<T>(key, storage) || undefined);

  const storeValue = { ...value, _key: key };
  storage.setItem(key, superjson.stringify(storeValue));
  notify(key, storeValue);
};

/**
 * Checks if a key exists in localStorage.
 *
 * @param key - The localStorage key to check.
 * @param storage - Storage instance to use (defaults to localStorage).
 * @returns True if the key exists, false otherwise.
 */
const existsInLocalStorage = (
  key: string,
  storage: Storage = localStorage,
): boolean => {
  return storage.getItem(key) !== null;
};

/**
 * Reads a value from localStorage.
 *
 * @template T - The type of data to read.
 * @param key - The localStorage key to read.
 * @param storage - Storage instance to use (defaults to localStorage).
 * @returns The parsed value or null if not found or parsing fails.
 */
const readFromLocalStorage = <T extends Record<string, any>>(
  key: string,
  storage: Storage = localStorage,
): T | null => {
  const item = storage.getItem(key);
  if (!item) return null;
  try {
    return superjson.parse(item);
  } catch (error) {
    console.error(`Failed to parse localStorage item "${key}":`, error);
    return null;
  }
};

export {
  createLocalStore,
  createLocalStoreQuery,
  existsInLocalStorage,
  deleteFromLocalStore,
  readFromLocalStorage,
  modifyLocalStore,
};
