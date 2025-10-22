/**
 * Kit Files API
 *
 * Simple file open functionality using native File API
 *
 * Queues saves and, on finalize:
 * - saves a single file directly
 * - bundles multiple files into a ZIP using fflate
 */

import { zipSync, strToU8 } from "fflate";
import { downloadFileFromContent } from "@/lib/client/files";
import { dateFormat } from "@/lib/utils/dates";
import { showFileDialog, showFolderDialog } from "@/lib/client/files";
import { KIT_INTERRUPT } from "./kit-types";

// ==========================
// Utils
// ==========================

type SourceType = string | Blob | ArrayBuffer;

// This queue holds items to be downloaded
let queue: {
  filename: string;
  source: SourceType;
  mimeType?: string;
}[] = [];

/**
 * Converts a source type to Uint8Array for ZIP
 */
const toUint8Array = async (source: SourceType) => {
  if (source instanceof Blob) {
    return new Uint8Array(await source.arrayBuffer());
  } else if (source instanceof ArrayBuffer) {
    return new Uint8Array(source);
  } else {
    return strToU8(source);
  }
};

// ==========================
// Public API
// ==========================

export const createFileAPI = () => ({
  /**
   * Adds an item to the save queue. All items will be downloaded when finalize is called.
   * @see finalize
   */
  save: (data: SourceType, filename: string, mimeType?: string) => {
    console.info(`[KitFile] Added ${filename} to download queue`);
    queue.push({ filename, source: data, mimeType });
  },

  /**
   * Open a file and return File object
   */
  open: showFileDialog,
  /**
   * Open multiple files and return array of File objects
   */
  openFolder: showFolderDialog,

  /**
   * Fetch a file from URL and return as File object
   */
  fetch: async (url: string, filename?: string): Promise<File> => {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        console.log(
          `[KitFile] Failed to fetch file ${url}: ${response.status} ${response.statusText}`,
        );
        throw KIT_INTERRUPT;
      }

      const blob = await response.blob();

      // Try to get filename from URL if not provided
      if (!filename) {
        const urlPath = new URL(url, window.location.origin).pathname;
        filename = urlPath.split("/").pop() || "downloaded-file";
      }

      // Create File object from blob
      const file = new File([blob], filename, {
        type: blob.type || "application/octet-stream",
      });

      return file;
    } catch (error) {
      console.error(`[KitFile] Error fetching file:`, error);
      throw KIT_INTERRUPT;
    }
  },

  /**
   * Downloads all files in the queue an clears it
   */
  finalize: async () => {
    if (queue.length === 0) return;

    if (queue.length === 1) {
      const { filename, source, mimeType } = queue[0];
      downloadFileFromContent(source, filename, mimeType);
      queue = [];
      return;
    }

    // Convert all sources to Uint8Array (await the promises)
    const filesArray = await Promise.all(
      queue.map(async ({ filename, source }) => ({
        filename,
        data: await toUint8Array(source),
      })),
    );

    // Create object for zipSync
    const files = filesArray.reduce(
      (acc, { filename, data }) => ({ ...acc, [filename]: data }),
      {} as Record<string, Uint8Array>,
    );

    const zipped = zipSync(files, { level: 0 });
    const date = dateFormat(new Date(), "YYMMDD-HHmmss");
    const zipName = `kit-download-${date}.zip`;
    downloadFileFromContent(zipped, zipName, "application/zip");

    queue = [];
  },

  /**
   * Clears queue
   */
  clearQueue: () => {
    queue = [];
  },
});
