import initSqlJs, { type Database } from "sql.js";
import { showFileDialog } from "@/lib/client/files";
import type { LoadCommand } from "./commands";

// Global database state - shared across all SQL code blocks
let globalDatabase: Database | null = null;
let globalDatabaseName: string = "default";
let globalDatabaseSource: "STORAGE" | "FILE" | "MEMORY" = "MEMORY";

// Local storage for named databases
const namedDatabases = new Map<string, Database>();

export async function getGlobalDatabase(
  loadCommand?: LoadCommand,
): Promise<{ db: Database; message: string; dbKey: string }> {
  let dbName = globalDatabaseName;
  let db = globalDatabase;

  // If no load command, use current global database or create default
  if (!loadCommand) {
    if (!globalDatabase) {
      const SQL = await initSqlJs({
        locateFile: (file: string) => `/wasm/${file}`,
      });
      globalDatabase = new SQL.Database();
      globalDatabaseName = "default";
      globalDatabaseSource = "MEMORY";

      return {
        db: globalDatabase,
        message: "Created new memory database 'default'",
        dbKey: globalDatabaseName,
      };
    }
    return {
      db: globalDatabase,
      message: `Using ${globalDatabaseSource === "STORAGE" ? "persistent" : "memory"} database '${globalDatabaseName}'`,
      dbKey: globalDatabaseName,
    };
  }

  // Load command specified - switch global database
  dbName = loadCommand.dbName;

  // Check if we already have this database loaded
  if (namedDatabases.has(dbName)) {
    globalDatabase = namedDatabases.get(dbName)!;
    globalDatabaseName = dbName;
    globalDatabaseSource = loadCommand.source;
    return {
      db: globalDatabase,
      message: `Switched to ${loadCommand.source === "STORAGE" ? "persistent" : "memory"} database '${dbName}'`,
      dbKey: dbName,
    };
  }

  const SQL = await initSqlJs({
    locateFile: (file: string) => `/wasm/${file}`,
  });

  let message = "";

  if (loadCommand.source === "STORAGE") {
    // Try to load from localStorage
    const savedData = loadDatabaseFromLocalStorage(dbName);
    if (savedData) {
      db = new SQL.Database(savedData);
      message = `Loaded persistent database '${dbName}' from storage`;
    } else {
      db = new SQL.Database();
      message = `Created new persistent database '${dbName}'`;
    }
  } else if (loadCommand.source === "FILE") {
    // Load from .db file
    const dbData = await loadDatabaseFromFile();
    db = new SQL.Database(dbData);
    message = `Loaded database '${dbName}' from file`;

    // Save to storage if requested
    if (loadCommand.saveToStorage) {
      saveDatabaseToLocalStorage(dbName, dbData);
      message += " and saved immediately to storage";
    }
  } else {
    // Memory database
    db = new SQL.Database();
    message = `Created new memory database '${dbName}'`;
  }

  // Set as global database
  globalDatabase = db;
  globalDatabaseName = dbName;
  globalDatabaseSource = loadCommand.source;

  // Store in named databases cache
  namedDatabases.set(dbName, db);

  // If persistent database, save on changes
  if (loadCommand.source === "STORAGE") {
    // Override exec to auto-save
    const originalExec = db.exec.bind(db);
    db.exec = function (sql: string) {
      const result = originalExec(sql);
      saveDatabaseToLocalStorage(dbName, db.export());
      return result;
    };
  }

  return { db, message, dbKey: dbName };
}

export function getCurrentDatabaseInfo(): {
  database: Database | null;
  name: string;
  source: string;
} {
  return {
    database: globalDatabase,
    name: globalDatabaseName,
    source: globalDatabaseSource,
  };
}

// localStorage helpers for persistent databases
function loadDatabaseFromLocalStorage(dbName: string): Uint8Array | null {
  const key = `db:${dbName}`;
  const base64Data = localStorage.getItem(key);
  if (!base64Data) return null;

  // Convert base64 to Uint8Array using browser APIs
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function saveDatabaseToLocalStorage(dbName: string, data: Uint8Array): void {
  const key = `db:${dbName}`;
  // Convert Uint8Array to base64 using browser APIs
  let binaryString = "";
  for (let i = 0; i < data.length; i++) {
    binaryString += String.fromCharCode(data[i]);
  }
  const base64Data = btoa(binaryString);
  localStorage.setItem(key, base64Data);
}

export function deleteDatabaseFromStorage(dbName: string): void {
  const key = `db:${dbName}`;
  localStorage.removeItem(key);

  // Also remove from named databases cache
  namedDatabases.delete(dbName);

  // If it was the current global database, reset to default
  if (globalDatabaseName === dbName) {
    globalDatabase = null;
    globalDatabaseName = "default";
    globalDatabaseSource = "MEMORY";
  }
}

async function loadDatabaseFromFile(): Promise<Uint8Array> {
  const file = await showFileDialog(
    "Select SQLite database file",
    ".db,.sqlite,.sqlite3",
  );
  const arrayBuffer = await file.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}
