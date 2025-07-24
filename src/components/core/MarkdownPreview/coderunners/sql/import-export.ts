import * as XLSX from "xlsx";
import { showFileDialog } from "@/lib/client/files";
import type { Database } from "sql.js";
import type { ImportCommand } from "./commands";

export interface ImportResult {
  success: boolean;
  rowCount?: number;
  message: string;
}

export interface CsvData {
  data: any[];
  rowCount: number;
  columnTypes: Record<string, string>;
}

export async function handleImport(
  importCmd: ImportCommand,
  db: Database,
): Promise<ImportResult> {
  try {
    const result = await loadCsvFile(importCmd);
    await importCsvToDatabase(
      result,
      importCmd.tablename,
      db,
      importCmd.overwrite,
    );

    return {
      success: true,
      rowCount: result.rowCount,
      message: `Imported ${result.rowCount} rows into table '${importCmd.tablename}'`,
    };
  } catch (error) {
    console.log("Import error:", error);
    if (error instanceof Error && error.message === "No file selected") {
      return {
        success: false,
        message: `Import cancelled`,
      };
    }
    // For debugging: log the actual error
    console.error("Unexpected import error:", error);
    throw error;
  }
}

async function loadCsvFile(importCmd: ImportCommand): Promise<CsvData> {
  const file = await showFileDialog("Select data file", ".csv,.xlsx,.xls");
  const arrayBuffer = await file.arrayBuffer();

  try {
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    if (!worksheet) {
      throw new Error("No data found in file");
    }

    const data = XLSX.utils.sheet_to_json(worksheet, {
      defval: null,
      raw: false,
      dateNF: "yyyy-mm-dd",
    });

    if (data.length === 0) {
      throw new Error("File is empty");
    }

    // Detect column types from data
    const columnTypes = detectColumnTypes(data);

    return { data, rowCount: data.length, columnTypes };
  } catch (error) {
    throw new Error(`File parsing error: ${error}`);
  }
}

async function importCsvToDatabase(
  csvResult: CsvData,
  tableName: string,
  db: Database,
  overwrite: boolean = false,
): Promise<void> {
  const { data, columnTypes } = csvResult;

  // Create table
  const columns = Object.keys(data[0]);
  const columnDefs = columns
    .map((col) => {
      const sanitized = col.replace(/[^a-zA-Z0-9_]/g, "_");
      const columnType = columnTypes[col] || "TEXT";
      return `"${sanitized}" ${columnType}`;
    })
    .join(", ");

  const createTableSql = `CREATE TABLE "${tableName}" (${columnDefs})`;

  // Drop table if overwrite is true
  if (overwrite) {
    db.exec(`DROP TABLE IF EXISTS "${tableName}"`);
  }

  // May throw error if table already exists and overwrite is false
  db.exec(createTableSql);

  // Insert data
  const placeholders = columns.map(() => "?").join(", ");
  const insertSql = `INSERT INTO "${tableName}" VALUES (${placeholders})`;
  const stmt = db.prepare(insertSql);

  for (const row of data) {
    const values = columns.map((col) => {
      const value = row[col];
      const type = columnTypes[col];

      // Convert values based on detected type
      if (value === null || value === undefined || value === "") {
        return null;
      }
      if (type === "INTEGER") {
        return parseInt(String(value), 10);
      }
      if (type === "REAL") {
        return parseFloat(String(value));
      }
      return String(value);
    });
    stmt.run(values);
  }
  stmt.free();
}

function detectColumnTypes(data: any[]): Record<string, string> {
  if (data.length === 0) return {};

  const columnTypes: Record<string, string> = {};
  const columns = Object.keys(data[0]);

  for (const col of columns) {
    let hasText = false;
    let hasReal = false;

    // Sample up to 100 rows for type detection
    for (let i = 0; i < Math.min(100, data.length); i++) {
      const value = data[i][col];
      if (value === null || value === undefined || value === "") continue;

      const num = Number(String(value).trim());
      if (isNaN(num)) {
        hasText = true;
        break; // TEXT wins, no need to check more
      } else if (!Number.isInteger(num)) {
        hasReal = true;
      }
    }

    columnTypes[col] = hasText ? "TEXT" : hasReal ? "REAL" : "INTEGER";
  }

  return columnTypes;
}

export function sqlResultsToCsv(result: any): string {
  const headers = result.columns;
  const rows = result.values;

  const csvContent = [
    headers.join(","),
    ...rows.map((row: any[]) =>
      row
        .map((cell) =>
          cell === null
            ? ""
            : typeof cell === "string" &&
                (cell.includes(",") ||
                  cell.includes('"') ||
                  cell.includes("\n"))
              ? `"${cell.replace(/"/g, '""')}"`
              : String(cell),
        )
        .join(","),
    ),
  ].join("\n");

  return csvContent;
}
