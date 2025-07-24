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

type StoreItem<T> = T & { _key: string };

// Global BroadcastChannel for cross-tab synchronization
const globalChannel = new BroadcastChannel("localstorage-sync");

const listeners = new Map<
  string | Function,
  Set<(key: string, value?: any) => void>
>();

/**
 * Subscribe to store changes for a specific key or filter function.
 *
 * @param keyOrFilter - Specific key string or filter function for multiple keys
 * @param callback - Function called when matching stores change
 * @returns Unsubscribe function
 */
const subscribe = (
  keyOrFilter: string | ((key: string) => boolean),
  callback: (key: string, value?: any) => void,
) => {
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
const notify = (key: string, value?: any, __fromBroadcast = false) => {
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

/**
 * Creates a reactive store with automatic localStorage persistence and cross-tab sync.
 *
 * @param key - Unique localStorage key
 * @param defaultValue - Default value when storage is empty
 * @param storage - Storage instance (defaults to localStorage)
 * @returns [store, setStore] tuple
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
): [Store<StoreItem<T>>, SetStoreFunction<StoreItem<T>>] => {
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
 * @param keysFilter - Function to filter which keys to include
 * @param options - Configuration options
 * @returns [stores, reload] tuple
 *
 * @example
 * ```tsx
 * const [pads] = createLocalStoreQuery(key => key.startsWith("pad:"));
 * ```
 */
const createLocalStoreQuery = <T extends Record<string, any>>(
  keysFilter?: (key: string) => boolean,
  options: {
    storage?: Storage;
    enhanceRecord?: (item: StoreItem<T>) => StoreItem<T>;
  } = {},
): [Store<StoreItem<T>[]>, () => void] => {
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
 */
const deleteFromLocalStore = (key: string, storage: Storage = localStorage) => {
  storage.removeItem(key);
  notify(key, null);
};

/**
 * Directly modifies a localStorage key and notifies all stores/queries.
 */
const modifyLocalStore = <T extends Record<string, any>>(
  key: string,
  value: T,
  storage: Storage = localStorage,
) => {
  const storeValue = { ...value, _key: key };
  storage.setItem(key, superjson.stringify(storeValue));
  notify(key, storeValue);
};

/**
 * Checks if a key exists in localStorage.
 */
const existsInLocalStorage = (key: string, storage: Storage = localStorage) => {
  return storage.getItem(key) !== null;
};

export {
  createLocalStore,
  createLocalStoreQuery,
  existsInLocalStorage,
  deleteFromLocalStore,
  modifyLocalStore,
};
