import type { CollectionEntry } from "astro:content";

/**
 * Sort blog entries by date in descending order (newest first)
 * @param array - Array of blog collection entries
 * @returns Sorted array with newest entries first
 */
export const sortByDate = (
  array: CollectionEntry<"blogs">[],
): CollectionEntry<"blogs">[] => {
  const sortedArray = array.sort((a, b) => {
    const dateA = new Date(a.data.date).getTime();
    const dateB = new Date(b.data.date).getTime();
    return dateB - dateA;
  });
  return sortedArray;
};
