/**
 * Kit Sheet API
 *
 * Read and write Excel and CSV files with simple API
 */

import Papa from "papaparse";
import readXlsxFile, { readSheetNames } from "read-excel-file";

/**
 * Parse a CSV file into an array of objects
 * @param file - CSV file to parse
 * @returns Array of objects with headers as keys
 */
const fromCsv = (file: File): Promise<Record<string, any>[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true, // Auto-detect headers from first row
      dynamicTyping: true, // Auto-detect numbers, booleans
      skipEmptyLines: true,
      complete: (result) => {
        if (result.errors.length > 0) {
          console.warn("[KitSheet] CSV parsing warnings:", result.errors);
        }
        resolve(result.data as Record<string, any>[]);
      },
      error: (error) => {
        console.error("[KitSheet] CSV parsing failed:", error);
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      },
    });
  });
};

/**
 * Get sheet names from an Excel file
 * @param file - Excel file to read
 * @returns Array of sheet names
 */
const getSheetNames = async (file: File): Promise<string[]> =>
  readSheetNames(file);

/**
 * Read a specific sheet from an Excel file
 * @param sheet - Sheet name to read
 * @param file - Excel file to read
 * @returns Array of objects with headers as keys
 */
const fromExcel = async (
  sheet: string,
  file: File,
): Promise<Record<string, any>[]> => {
  try {
    // First, check if sheet exists
    const sheetNames = await getSheetNames(file);
    if (!sheetNames.includes(sheet)) {
      throw new Error(
        `Sheet "${sheet}" not found. Available sheets: ${sheetNames.join(", ")}`,
      );
    }

    // Read the specific sheet
    const rows = await readXlsxFile(file, {
      sheet,
    });

    if (rows.length === 0) {
      return [];
    }

    // Convert rows to objects using first row as headers
    const headers = rows[0].map((header) =>
      String(header || `Column_${rows[0].indexOf(header)}`),
    );
    const data = rows.slice(1).map((row) => {
      const obj: Record<string, any> = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] ?? null;
      });
      return obj;
    });

    console.info(`[KitExcel] Read ${data.length} rows from sheet "${sheet}"`);
    return data;
  } catch (error) {
    // Re-throw if it's already our error
    if (error instanceof Error && error.message.includes("Sheet")) {
      throw error;
    }
    console.error("[KitSheet] Failed to get sheet names:", error);
    throw new Error(
      `Failed to read Excel file: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};

/**
 * Convert array of objects to CSV string
 * @param data - Array of objects to convert
 * @returns CSV string with headers
 */
const toCsv = (data: any[]): string => {
  if (!Array.isArray(data)) {
    throw new Error("Data must be an array");
  }

  if (data.length === 0) {
    return "";
  }

  // Papa.unparse automatically uses object keys as headers
  const csv = Papa.unparse(data, {
    header: true,
    skipEmptyLines: true,
  });

  console.info(`[KitSheet] Generated CSV with ${data.length} rows`);
  return csv;
};

// ==========================
// Public API
// ==========================

export const createSheetAPI = () => ({
  fromCsv,
  fromExcel,
  getSheetNames,
  toCsv,
});
