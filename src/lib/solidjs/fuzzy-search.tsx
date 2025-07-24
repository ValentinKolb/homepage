import Fuse, {
  type FuseResult,
  type FuseResultMatch,
  type IFuseOptions,
} from "fuse.js";
import { createMemo, type Accessor } from "solid-js";

type SearchResult<T> = {
  item: T;
  query: string;
  matches?: readonly FuseResultMatch[];
  score?: number;
};

/**
 * Creates a reactive fuzzy search that automatically handles memoization and intelligent sorting.
 *
 * This function provides an optimized fuzzy search solution using Fuse.js with automatic
 * performance optimizations for SolidJS applications. It handles both search scenarios
 * (fuzzy matching with score-based sorting) and browse scenarios (custom sorting when no query).
 *
 * Features:
 * - Automatic memoization for optimal performance
 * - Intelligent sorting based on context (score vs custom)
 * - Configurable minimum match length with smart fallbacks
 * - Full Fuse.js configuration support
 * - Type-safe with full TypeScript support
 * - Real-time reactivity with SolidJS signals
 *
 * @template T - The type of the documents being searched
 * @param query - Reactive accessor containing the search query string
 * @param documents - Reactive accessor containing the array of documents to search
 * @param config - Configuration object extending Fuse.js options
 * @param config.defaultSort - Optional sorting function used when no search query is provided
 * @param config.keys - Fuse.js search keys configuration (e.g., [{ name: "title", weight: 0.7 }])
 * @param config.threshold - Fuse.js matching threshold (0.0 = perfect match, 1.0 = match anything)
 * @param config.minMatchCharLength - Minimum query length before search is performed (default: 2)
 * @returns Reactive accessor containing array of search results with metadata
 *
 * @example
 * ```tsx
 * interface User {
 *   id: string;
 *   name: string;
 *   email: string;
 *   lastLogin: Date;
 * }
 *
 * const [searchTerm, setSearchTerm] = createSignal("");
 * const [users] = createSignal<User[]>([...]);
 *
 * // Basic usage with custom sorting
 * const searchResults = createFuzzySearch(searchTerm, users, {
 *   keys: [
 *     { name: "name", weight: 0.7 },
 *     { name: "email", weight: 0.3 }
 *   ],
 *   defaultSort: (a, b) => b.lastLogin.getTime() - a.lastLogin.getTime()
 * });
 *
 * // Access results
 * const resultCount = () => searchResults().length;
 * const firstResult = () => searchResults()[0]; // includes item, score, matches
 * ```
 */
const createFuzzySearch = <T,>(
  query: Accessor<string>,
  documents: Accessor<T[]>,
  config?: IFuseOptions<T> & {
    defaultSort?: (a: T, b: T) => number;
  },
): Accessor<SearchResult<T>[]> => {
  // Extract defaultSort from config
  const { defaultSort, ...fuseConfig } = config || {};

  // Default Fuse.js options
  const defaultOptions: IFuseOptions<T> = {
    threshold: 0.6,
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 2,
    distance: 100,
    ...fuseConfig,
  };

  // Create Fuse instance with memo for performance
  const fuse = createMemo(() => {
    return new Fuse(documents(), defaultOptions);
  });

  // Search results with fuzzy search
  const searchResults = createMemo(() => {
    const term = query().trim();
    const currentDocuments = documents();

    if (!term) {
      // No search term - return all documents with optional sorting
      const items = currentDocuments.map((item) => ({
        item,
        query: term,
        matches: undefined,
        score: undefined,
      }));

      if (defaultSort) {
        return items.sort((a, b) => defaultSort(a.item, b.item));
      }

      return items;
    }

    if (term.length < (defaultOptions.minMatchCharLength || 2)) {
      // Search term too short - return all documents with optional sorting
      const items = currentDocuments.map((item) => ({
        item,
        query: term,
        matches: undefined,
        score: undefined,
      }));

      if (defaultSort) {
        return items.sort((a, b) => defaultSort(a.item, b.item));
      }

      return items;
    }

    // Perform fuzzy search and sort by score
    const fuseResults = fuse().search(term);
    return fuseResults
      .map((result: FuseResult<T>) => ({
        item: result.item,
        query: term,
        matches: result.matches,
        score: result.score,
      }))
      .sort((a, b) => (a.score || 0) - (b.score || 0));
  });

  return searchResults;
};

export { createFuzzySearch, type SearchResult };
