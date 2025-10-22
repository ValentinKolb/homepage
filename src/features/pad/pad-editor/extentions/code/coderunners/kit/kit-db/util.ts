/**
 * Kit Database Utilities
 *
 * Types and worker communication utilities
 */

import type { WorkerApi } from "./worker";

// ==========================
// Types & Helpers
// ==========================

export type DBProtocol = "opfs" | "memory";
export type DBResult<T> = Promise<
  | {
      logs: string[];
      data: T;
    }
  | { error: string }
>;

/**
 * Parse database URI into protocol and name
 */
export const parseURI = (uri: string) => {
  const match = uri.match(/^(memory|opfs):\/\/(.+?)(?:\.[^.]+)?$/);
  if (!match) throw new Error(`Invalid database URI: ${uri}`);

  return {
    protocol: match[1] as DBProtocol,
    name: match[2],
  };
};

// ==========================
// Import Data Helper
// ==========================

/**
 * Detect SQL type from JavaScript values
 */
const detectSQLType = (values: any[]): string => {
  const nonNullValues = values.filter((v) => v !== null && v !== undefined);
  if (nonNullValues.length === 0) return "TEXT";

  // Check if all are numbers
  if (nonNullValues.every((v) => typeof v === "number")) {
    // Check if all are integers
    if (nonNullValues.every((v) => Number.isInteger(v))) {
      return "INTEGER";
    }
    return "REAL";
  }

  // Check if all are booleans
  if (nonNullValues.every((v) => typeof v === "boolean")) {
    return "INTEGER"; // SQLite stores booleans as 0/1
  }

  // Default to TEXT
  return "TEXT";
};

export const createImportData = (impl: WorkerApi) => {
  return async (
    uri: string,
    tableName: string,
    data: Record<string, any>[],
  ): Promise<void> => {
    if (!Array.isArray(data) || data.length === 0) {
      console.warn("[KitDB] No data to import");
      return;
    }

    // Sample first 100 rows for type detection
    const sample = data.slice(0, Math.min(100, data.length));
    const columns = Object.keys(data[0]);

    // Detect column types
    const columnTypes: Record<string, string> = {};
    for (const column of columns) {
      columnTypes[column] = detectSQLType(sample.map((row) => row[column]));
    }

    // Create table if not exists
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS "${tableName}" (
        ${columns.map((col) => `"${col}" ${columnTypes[col]}`).join(",\n        ")}
      )
    `;

    const createResult = await impl.execute(uri, createTableSQL);
    if ("error" in createResult) {
      throw new Error(createResult.error);
    }

    // Process in chunks
    const chunkSize = 1000;
    const totalRows = data.length;

    for (let i = 0; i < totalRows; i += chunkSize) {
      const chunk = data.slice(i, Math.min(i + chunkSize, totalRows));

      // Build INSERT statement for chunk
      const placeholders = chunk
        .map(() => `(${columns.map(() => "?").join(", ")})`)
        .join(", ");

      const insertSQL = `
        INSERT INTO "${tableName}" (${columns.map((col) => `"${col}"`).join(", ")})
        VALUES ${placeholders}
      `;

      // Flatten values for batch insert
      const values: any[] = [];
      for (const row of chunk) {
        for (const col of columns) {
          let value = row[col];
          // Convert booleans to integers for SQLite
          if (typeof value === "boolean") {
            value = value ? 1 : 0;
          }
          values.push(value);
        }
      }

      const insertResult = await impl.execute(uri, insertSQL, values);
      if ("error" in insertResult) {
        throw new Error(insertResult.error);
      }

      // Progress logging for large datasets
      if (totalRows > 2000) {
        const progress = Math.min(i + chunkSize, totalRows);
        if ("progress" in console) {
          //@ts-ignore
          console.progress(
            `[KitDB] Importing ${totalRows} rows into "${tableName}"`,
            (progress * 100) / totalRows,
          );
        }
      }
    }
  };
};
