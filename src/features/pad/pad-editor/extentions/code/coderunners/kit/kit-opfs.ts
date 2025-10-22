/**
 * Kit OPFS API
 *
 * Minimal file system operations using Origin Private File System
 */

import { OPFS } from "@/lib/client/files";

// ==========================
// Shared Encoder/Decoder instances
// ==========================

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

// ==========================
// Public API
// ==========================

export const createOpfsAPI = () => ({
  /**
   * List directory contents
   * @param path - Directory path (optional, defaults to root)
   * @returns Array of entry names (directories end with /)
   */
  ls: (path?: string): Promise<string[]> => {
    const dirPath = path || "";
    return OPFS.ls(dirPath);
  },

  /**
   * Remove file or directory (recursive)
   * @param path - Path to remove
   */
  rm: async (path: string): Promise<void> => {
    if (!path || path === "/" || path === ".") {
      throw new Error("Cannot delete root directory");
    }
    await OPFS.delete(path);
  },

  /**
   * Write file (creates parent directories if needed)
   * @param path - File path
   * @param data - File content
   */
  write: async (path: string, data: string | Uint8Array): Promise<void> => {
    const bytes = typeof data === "string" ? textEncoder.encode(data) : data;
    await OPFS.write(path, bytes);
  },

  /**
   * Read file content
   * @param path - File path
   * @returns File content as string or undefined
   */
  read: async (path: string): Promise<string | undefined> => {
    const bytes = await OPFS.read(path);
    if (!bytes) return undefined;
    return textDecoder.decode(bytes);
  },

  /**
   * Read file as bytes
   * @param path - File path
   * @returns File content as Uint8Array or undefined
   */
  readBytes: async (path: string): Promise<Uint8Array | undefined> => {
    return OPFS.read(path);
  },
});
