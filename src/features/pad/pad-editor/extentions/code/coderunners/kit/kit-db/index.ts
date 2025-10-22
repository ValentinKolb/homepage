/**
 * Kit Database API
 *
 * Main database API with URI-based storage (memory:// and opfs://)
 */

import { KIT_INTERRUPT } from "../kit-types";
import { createImportData, parseURI } from "./util";
import * as Comlink from "comlink";
import type { WorkerApi } from "./worker";

// ==========================
// Database Implementation
// ==========================

let workerApi: WorkerApi | null = null;

// get or create Comlink worker API
const worker = () => {
  if (!workerApi) {
    const worker = new Worker(new URL("./worker.ts", import.meta.url), {
      type: "module",
    });
    workerApi = Comlink.wrap<WorkerApi>(worker);
  }
  return workerApi;
};

// start worker on import
worker();

// the database currently in use
let currentUri: string | undefined = undefined;
const use = async (uri: string = "memory://default") => {
  if (currentUri === uri) return;
  parseURI(uri);
  console.info(`[KitDB] Using database: ${uri}`);
  currentUri = uri;
};

// ==========================
// Public API
// ==========================

export const createDbAPI = () => ({
  /**
   * Use a database by URI
   * @param uri - Database URI (memory://, opfs://)
   */
  use,

  /**
   * Get current database URI
   */
  info: () =>
    currentUri
      ? `Connected to ${currentUri}`
      : "Not connected, connect to a database using the use() function",

  /**
   * Execute SQL query
   */
  exec: async (sql: string, params?: any[]) => {
    if (!currentUri) use();
    const result = await worker().execute(currentUri!, sql, params);

    if ("error" in result) {
      console.error(`[KitDB] ${result.error}`);
      throw KIT_INTERRUPT;
    }

    // Log messages
    result.logs.forEach((log) => console.info(`[KitDB] ${log}`));

    return result.data;
  },

  /**
   * Export database as Uint8Array
   */
  dump: async () => {
    if (!currentUri) use();
    const result = await worker().dump(currentUri!);

    if ("error" in result) {
      console.error(`[KitDB] ${result.error}`);
      throw KIT_INTERRUPT;
    }

    // Log messages
    result.logs.forEach((log) => console.info(`[KitDB] ${log}`));

    return result.data;
  },

  /**
   * Import database from Uint8Array
   */
  load: async (data: Uint8Array) => {
    if (!currentUri) use();
    const result = await worker().load(currentUri!, data);

    if ("error" in result) {
      console.error(`[KitDB] ${result.error}`);
      throw KIT_INTERRUPT;
    }

    // Log messages
    result.logs.forEach((log) => console.info(`[KitDB] ${log}`));
  },

  /**
   * Drop database
   */
  destroy: async (uri: string) => {
    const result = await worker().destroy(uri);

    if ("error" in result) {
      console.error(`[KitDB] ${result.error}`);
      throw KIT_INTERRUPT;
    }

    // Log messages
    result.logs.forEach((log) => console.info(`[KitDB] ${log}`));

    // Clear current URI if it matches the dropped URI
    if (uri === currentUri) currentUri = undefined;
  },

  /**
   * Import data into a table with automatic schema detection
   */
  importData: async (tableName: string, data: Record<string, any>[]) => {
    if (!currentUri) use();
    const importFn = createImportData(worker());
    await importFn(currentUri!, tableName, data);
  },

  schema: async () => {
    if (!currentUri)
      throw new Error(
        "No database selected, connect to a database using the 'use' function",
      );
    const result = await worker().execute(
      currentUri!,
      "SELECT name, type, sql FROM sqlite_master ORDER BY type, name;",
    );

    if ("error" in result) {
      console.error(`[KitDB] ${result.error}`);
      throw KIT_INTERRUPT;
    }

    // Log messages
    result.logs.forEach((log) => console.info(`[KitDB] ${log}`));

    return result.data;
  },
});
