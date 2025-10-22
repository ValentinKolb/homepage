/**
 * Kit Database Worker
 *
 * SQL.js worker with OPFS and memory database support
 */

import initSqlJs from "sql.js";
import type { Database, SqlJsStatic } from "sql.js";
import * as Comlink from "comlink";
import { OPFS } from "../../../../../../../../lib/client/files";
import { type DBResult, type DBProtocol, parseURI } from "./util";
import { pprintBytes } from "../../../../../../../../lib/utils/text";

// ==========================
// State
// ==========================

let SQL: SqlJsStatic | null = null;
const databases = new Map<
  string,
  {
    instance: Database;
    protocol: DBProtocol;
    name: string;
  }
>();

// ==========================
// Initialize SQL.js
// ==========================

const initSQL = async (): Promise<void> => {
  if (SQL) return;
  SQL = await initSqlJs({
    locateFile: () => "/wasm/sql.wasm",
  });
};

// ==========================
// Database Management
// ==========================

/**
 * Retrieves a database instance from the cache or initializes a new one.
 */
const getDatabase = async (
  uri: string,
): Promise<{
  instance: Database;
  protocol: DBProtocol;
  name: string;
}> => {
  const existing = databases.get(uri);
  if (existing) return existing;

  await initSQL();
  const { protocol, name } = parseURI(uri);

  // Load existing database for OPFS
  let data: Uint8Array | undefined = undefined;
  if (protocol === "opfs") data = await OPFS.read(`.kitdb/${name}.sqlite`);

  const instance = new SQL!.Database(data);
  const db = { instance, protocol, name };

  databases.set(uri, db);
  return db;
};

/**
 * Saves the database to OPFS (in-memory db's are ignored)
 */
const saveDatabase = async (uri: string): Promise<void> => {
  const db = databases.get(uri);
  if (!db || db.protocol === "memory") return;

  // Save to OPFS for persistent databases
  const data = db.instance.export();
  await OPFS.write(`.kitdb/${db.name}.sqlite`, data);
};

// ==========================
// Worker API Implementation
// ==========================

const workerApi = {
  /**
   * Execute SQL query
   */
  execute: async (
    uri: string,
    sql: string,
    params?: any[],
  ): DBResult<undefined | {}[]> => {
    try {
      const db = await getDatabase(uri);
      const logs: string[] = [];

      // Execute SQL
      const results = db.instance.exec(sql, params);
      const res = results[results.length - 1];

      // Auto-save for write operations on persistent databases
      if (sql.match(/INSERT|UPDATE|DELETE|CREATE|DROP|ALTER/i)) {
        await saveDatabase(uri);
      }

      // No rows returned
      if (!res) return { logs, data: undefined };

      // Convert to array of objects
      const data = res.values.map((row) =>
        Object.fromEntries(res.columns.map((col, idx) => [col, row[idx]])),
      );
      return { logs, data };
    } catch (error) {
      return {
        error: `SQL execution failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },

  /**
   * Deletes a database
   */
  destroy: async (uri: string): DBResult<void> => {
    if (databases.has(uri)) databases.delete(uri);
    const { protocol, name } = parseURI(uri);
    if (protocol === "opfs") {
      await OPFS.delete(`.kitdb/${name}.sqlite`).catch(() => {});
    }
    return { logs: [`Deleted database: ${name}`], data: undefined };
  },

  /**
   * Export database as Uint8Array
   */
  dump: async (uri: string): DBResult<Uint8Array> => {
    try {
      const db = await getDatabase(uri);
      const data = db.instance.export();

      // Transfer the Uint8Array buffer to avoid copying
      return {
        logs: [`Dumped database: ${db.name} (${pprintBytes(data.length)})`],
        data: Comlink.transfer(data, [data.buffer]),
      };
    } catch (error) {
      return {
        error: `Failed to dump database: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },

  /**
   * Load database from Uint8Array
   */
  load: async (uri: string, data: Uint8Array): DBResult<void> => {
    try {
      await initSQL();
      const { protocol, name } = parseURI(uri);

      // Close existing database if it exists
      const existing = databases.get(uri);
      if (existing) {
        existing.instance.close();
        databases.delete(uri);
      }

      // Create new database from data
      const instance = new SQL!.Database(data);
      const db = { instance, protocol, name };
      databases.set(uri, db);

      const logs = [`Loaded database: ${name} (${pprintBytes(data.length)})`];

      // Save to OPFS if persistent
      await saveDatabase(uri);

      return { logs, data: undefined };
    } catch (error) {
      return {
        error: `Failed to load database: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
};

// ==========================
// Expose API with Comlink
// ==========================

Comlink.expose(workerApi);
export type WorkerApi = typeof workerApi;

// Automatically initialize SQL.js on worker start
initSQL().catch((error) => {
  console.error("[KitDB Worker] Failed to initialize SQL.js:", error);
});
