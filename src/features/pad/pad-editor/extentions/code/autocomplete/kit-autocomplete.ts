/**
 * Kit API Autocomplete for CodeMirror
 *
 * Provides intelligent code completion for the Kit API
 * including method signatures and documentation.
 */

import type {
  CompletionContext,
  CompletionResult,
  Completion,
} from "@codemirror/autocomplete";
import { snippetCompletion } from "@codemirror/autocomplete";
import { javascriptLanguage } from "@codemirror/lang-javascript";

// ==========================
// Top Level Completions
// ==========================

const topLevelCompletions: Completion[] = [
  {
    label: "dialog",
    type: "namespace",
    detail: "User dialogs",
    info: "Show prompts, alerts, and confirmations to interact with users",
  },
  {
    label: "file",
    type: "namespace",
    detail: "File operations",
    info: "Open, save, and manage files",
  },
  {
    label: "db",
    type: "namespace",
    detail: "Database",
    info: "SQL database with persistent storage",
  },
  {
    label: "store",
    type: "namespace",
    detail: "Key-Value Store",
    info: "Persistent key-value storage with OPFS backend",
  },
  {
    label: "opfs",
    type: "namespace",
    detail: "File System",
    info: "Origin Private File System for file operations",
  },
  {
    label: "util",
    type: "namespace",
    detail: "Utilities",
    info: "Helper functions like sleep, fetch, random",
  },
  {
    label: "date",
    type: "namespace",
    detail: "Date & Time",
    info: "Date manipulation with Day.js",
  },
  {
    label: "sheet",
    type: "namespace",
    detail: "Excel & CSV",
    info: "Read and write Excel and CSV files",
  },
];

// ==========================
// Dialog API Completions
// ==========================

const dialogCompletions: Completion[] = [
  snippetCompletion("prompt(${1:'message'})", {
    label: "prompt",
    type: "method",
    detail: "(message, default?) → Promise<string>",
    info: "Show a text input dialog. Returns user input or null if cancelled.",
  }),
  snippetCompletion("promptNumber(${1:'message'})", {
    label: "promptNumber",
    type: "method",
    detail: "(message, default?) → Promise<number>",
    info: "Show a number input dialog. Returns number or null if cancelled.",
  }),
  snippetCompletion("alert(${1:'message'})", {
    label: "alert",
    type: "method",
    detail: "(message) → Promise<void>",
    info: "Show an information dialog with OK button.",
  }),
  snippetCompletion("confirm(${1:'message'})", {
    label: "confirm",
    type: "method",
    detail: "(message) → Promise<boolean>",
    info: "Show a confirmation dialog. Returns true for OK, false for Cancel.",
  }),
  snippetCompletion(
    "form({\n  ${1:fieldName}: {\n    type: '${2|text,number,boolean,select,tags,currency,image,pin|}',\n    ${3:required: true}\n  }\n})",
    {
      label: "form",
      type: "method",
      detail: "(schema) → Promise<values|null>",
      info: "Dynamic form builder. Schema: {field: {type, label?, required?, default?, validate?}}. Types: text, number, boolean, select, tags, currency, image, pin, info.",
    },
  ),
];

// ==========================
// Utils API Completions
// ==========================

const utilsCompletions: Completion[] = [
  snippetCompletion("sleep(${1:1000})", {
    label: "sleep",
    type: "method",
    detail: "(ms: number) → Promise<void>",
    info: "Pause execution for specified milliseconds.",
  }),
  snippetCompletion("fetch(${1:'url'})", {
    label: "fetch",
    type: "method",
    detail: "(url, options?) → Promise<Response>",
    info: "Make HTTP requests. Same as browser fetch API.",
  }),
  snippetCompletion("random(${1:0}, ${2:1})", {
    label: "random",
    type: "method",
    detail: "(min?, max?, step?) → number",
    info: "Generate random number between min and max. Optional step for rounding.",
  }),
  snippetCompletion("shuffle(${1:array})", {
    label: "shuffle",
    type: "method",
    detail: "(array: any[]) → any[]",
    info: "Randomly shuffle array elements in place. Returns the same array.",
  }),
  snippetCompletion("lorem(${1:50})", {
    label: "lorem",
    type: "method",
    detail: "(count?: number) → string",
    info: "Generate lorem ipsum text with specified word count. Default: 50 words.",
  }),
];

// ==========================
// Database API Completions
// ==========================

const dbCompletions: Completion[] = [
  {
    label: "info",
    type: "method",
    detail: "() → string",
    info: "Get current database connection info and status.",
  },
  snippetCompletion("use(${1:'memory://default'})", {
    label: "use",
    type: "method",
    detail: "(uri: string) → Promise<void>",
    info: "Connect to database by URI. Supports memory:// and opfs:// protocols.",
  }),
  snippetCompletion("exec(${1:'SELECT * FROM table'})", {
    label: "exec",
    type: "method",
    detail: "(sql, params?) → Promise<Record[]>",
    info: "Execute SQL query. Returns array of objects for SELECT, undefined for others.",
  }),
  {
    label: "dump",
    type: "method",
    detail: "() → Promise<Uint8Array>",
    info: "Export current database as Uint8Array for backup or transfer.",
  },
  snippetCompletion("load(${1:data})", {
    label: "load",
    type: "method",
    detail: "(data: Uint8Array) → Promise<void>",
    info: "Import database from Uint8Array into current database URI.",
  }),
  {
    label: "schema",
    type: "method",
    detail: "() → Promise<object>",
    info: "Get complete database schema with all tables, indexes, and views.",
  },
  snippetCompletion("destroy(${1:'opfs://dbname'})", {
    label: "destroy",
    type: "method",
    detail: "(uri: string) → Promise<void>",
    info: "Permanently delete a database by URI. Use with caution!",
  }),
  snippetCompletion("importData(${1:'table'}, ${2:data})", {
    label: "importData",
    type: "method",
    detail: "(table, data) → Promise<void>",
    info: "Import array of objects into table. Auto-creates table with type detection.",
  }),
];

// ==========================
// File API Completions
// ==========================

const fileCompletions: Completion[] = [
  {
    label: "open",
    type: "method",
    detail: "() → Promise<File>",
    info: "Open file picker dialog. Returns selected File object.",
  },
  {
    label: "openFolder",
    type: "method",
    detail: "() → Promise<File[]>",
    info: "Open folder picker. Returns array of File objects.",
  },
  snippetCompletion("save(${1:data}, ${2:'filename.txt'})", {
    label: "save",
    type: "method",
    detail: "(data, filename, mimeType?) → void",
    info: "Queue file for download. Downloads happen when script finishes.",
  }),
  snippetCompletion("fetch(${1:'https://example.com/file.csv'})", {
    label: "fetch",
    type: "method",
    detail: "(url, filename?) → Promise<File>",
    info: "Download file from URL. Returns File object for further processing.",
  }),
];

// ==========================
// Date API Completions
// ==========================

const dateCompletions: Completion[] = [
  snippetCompletion("new(${1:'2024-01-01'})", {
    label: "new",
    type: "method",
    detail: "(input?) → Dayjs",
    info: "Create Day.js date from ISO string, Date, or timestamp. Returns chainable Day.js object.",
  }),
  {
    label: "now",
    type: "method",
    detail: "() → Dayjs",
    info: "Get current date and time as Day.js object. Returns chainable Day.js object.",
  },
  {
    label: "today",
    type: "method",
    detail: "() → Dayjs",
    info: "Get today at midnight as Day.js object. Returns chainable Day.js object.",
  },
  snippetCompletion("unix(${1:timestamp})", {
    label: "unix",
    type: "method",
    detail: "(seconds) → Dayjs",
    info: "Create Day.js from Unix timestamp (seconds since epoch). Returns chainable Day.js object.",
  }),
  snippetCompletion("locale(${1:'en'})", {
    label: "locale",
    type: "method",
    detail: "(code?) → string",
    info: "Set or get locale. Supports 'de', 'en', 'fr'.",
  }),
  snippetCompletion("isValidISO(${1:'2024-01-01'})", {
    label: "isValidISO",
    type: "method",
    detail: "(string) → boolean",
    info: "Check if string is valid ISO date format.",
  }),
  snippetCompletion("toSQL(${1:date})", {
    label: "toSQL",
    type: "method",
    detail: "(dayjs) → string",
    info: "Format Day.js object as SQL datetime string.",
  }),
  snippetCompletion("duration(${1:1000}, ${2:'milliseconds'})", {
    label: "duration",
    type: "method",
    detail: "(value, unit?) → Duration",
    info: "Create a duration. Units: 'milliseconds', 'seconds', 'minutes', 'hours', 'days', etc.",
  }),
];

// ==========================
// Sheet API Completions
// ==========================

const sheetCompletions: Completion[] = [
  snippetCompletion("fromCsv(${1:file})", {
    label: "fromCsv",
    type: "method",
    detail: "(file: File) → Promise<Record[]>",
    info: "Parse CSV file into array of objects with auto-detected headers",
  }),
  snippetCompletion("fromExcel(${1:'Sheet1'}, ${2:file})", {
    label: "fromExcel",
    type: "method",
    detail: "(sheet: string, file: File) → Promise<Record[]>",
    info: "Read specific sheet from Excel file. Throws error if sheet doesn't exist",
  }),
  snippetCompletion("getSheetNames(${1:file})", {
    label: "getSheetNames",
    type: "method",
    detail: "(file: File) → Promise<string[]>",
    info: "Get list of all sheet names in an Excel file",
  }),
  snippetCompletion("toCsv(${1:data})", {
    label: "toCsv",
    type: "method",
    detail: "(data: any[]) → string",
    info: "Convert array of objects to CSV string with headers from object keys",
  }),
];

// ==========================
// Store API Completions
// ==========================

const storeCompletions: Completion[] = [
  snippetCompletion("set(${1:'key'}, ${2:value})", {
    label: "set",
    type: "method",
    detail: "(key: string, value: any) → Promise<void>",
    info: "Set a value in the store. Value will be serialized automatically.",
  }),
  snippetCompletion("get(${1:'key'})", {
    label: "get",
    type: "method",
    detail: "(key: string) → Promise<any>",
    info: "Get a value from the store. Returns undefined if key doesn't exist.",
  }),
  snippetCompletion("delete(${1:'key'})", {
    label: "delete",
    type: "method",
    detail: "(key: string) → Promise<void>",
    info: "Delete a key from the store.",
  }),
  snippetCompletion("list(${1:'prefix'})", {
    label: "list",
    type: "method",
    detail: "(prefix?: string) → Promise<string[]>",
    info: "List all keys with optional prefix filter. Returns sorted array.",
  }),
  {
    label: "clear",
    type: "method",
    detail: "() → Promise<void>",
    info: "Clear all data from the store. Use with caution!",
  },
];

// ==========================
// OPFS API Completions
// ==========================

const opfsCompletions: Completion[] = [
  snippetCompletion("ls(${1:'path'})", {
    label: "ls",
    type: "method",
    detail: "(path?: string) → Promise<string[]>",
    info: "List directory contents. Directories end with /. Defaults to root.",
  }),
  snippetCompletion("rm(${1:'path'})", {
    label: "rm",
    type: "method",
    detail: "(path: string) → Promise<void>",
    info: "Remove file or directory recursively. Cannot delete root.",
  }),
  snippetCompletion("write(${1:'path'}, ${2:'content'})", {
    label: "write",
    type: "method",
    detail: "(path: string, data: string | Uint8Array) → Promise<void>",
    info: "Write file. Creates parent directories if needed.",
  }),
  snippetCompletion("read(${1:'path'})", {
    label: "read",
    type: "method",
    detail: "(path: string) → Promise<string | undefined>",
    info: "Read file content as string. Returns undefined if file doesn't exist.",
  }),
  snippetCompletion("readBytes(${1:'path'})", {
    label: "readBytes",
    type: "method",
    detail: "(path: string) → Promise<Uint8Array | undefined>",
    info: "Read file content as Uint8Array. Returns undefined if file doesn't exist.",
  }),
];

// ==========================
// Main Completion Source
// ==========================

/**
 * Kit API completion source for CodeMirror
 * @param context - CodeMirror completion context
 * @returns Completion result or null
 */
const kitCompletionSource = (
  context: CompletionContext,
): CompletionResult | null => {
  // Check what we're completing
  const word = context.matchBefore(/kit\.[\w.]*/) || context.matchBefore(/kit/);

  if (!word) return null;

  const text = word.text;
  const afterDot = /\.$/.test(text);

  // Completing "kit"
  if (text === "ki" || text === "kit") {
    return {
      from: word.from,
      options: [
        {
          label: "kit",
          type: "namespace",
          detail: "Kit API",
          info: "The main Kit API object with utilities for pad development",
        },
      ],
    };
  }

  // Completing after "kit."
  if (text === "kit." || /^kit\.\w*$/.test(text)) {
    return {
      from: afterDot ? word.to : word.from + 4, // +4 to skip "kit."
      options: topLevelCompletions,
      validFor: /^\w*$/,
    };
  }

  // Completing after "kit.dialog."
  if (text === "kit.dialog." || /^kit\.dialog\.\w*$/.test(text)) {
    const lastDotPos = text.lastIndexOf(".");
    return {
      from: word.from + lastDotPos + 1,
      options: dialogCompletions,
      validFor: /^\w*$/,
    };
  }

  // Completing after "kit.util."
  if (text === "kit.util." || /^kit\.util\.\w*$/.test(text)) {
    const lastDotPos = text.lastIndexOf(".");
    return {
      from: word.from + lastDotPos + 1,
      options: utilsCompletions,
      validFor: /^\w*$/,
    };
  }

  // Completing after "kit.db."
  if (text === "kit.db." || /^kit\.db\.\w*$/.test(text)) {
    const lastDotPos = text.lastIndexOf(".");
    return {
      from: word.from + lastDotPos + 1,
      options: dbCompletions,
      validFor: /^\w*$/,
    };
  }

  // Completing after "kit.file."
  if (text === "kit.file." || /^kit\.file\.\w*$/.test(text)) {
    const lastDotPos = text.lastIndexOf(".");
    return {
      from: word.from + lastDotPos + 1,
      options: fileCompletions,
      validFor: /^\w*$/,
    };
  }

  // Completing after "kit.date."
  if (text === "kit.date." || /^kit\.date\.\w*$/.test(text)) {
    const lastDotPos = text.lastIndexOf(".");
    return {
      from: word.from + lastDotPos + 1,
      options: dateCompletions,
      validFor: /^\w*$/,
    };
  }

  // Completing after "kit.sheet."
  if (text === "kit.sheet." || /^kit\.sheet\.\w*$/.test(text)) {
    const lastDotPos = text.lastIndexOf(".");
    return {
      from: word.from + lastDotPos + 1,
      options: sheetCompletions,
      validFor: /^\w*$/,
    };
  }

  // Completing after "kit.store."
  if (text === "kit.store." || /^kit\.store\.\w*$/.test(text)) {
    const lastDotPos = text.lastIndexOf(".");
    return {
      from: word.from + lastDotPos + 1,
      options: storeCompletions,
      validFor: /^\w*$/,
    };
  }

  // Completing after "kit.opfs."
  if (text === "kit.opfs." || /^kit\.opfs\.\w*$/.test(text)) {
    const lastDotPos = text.lastIndexOf(".");
    return {
      from: word.from + lastDotPos + 1,
      options: opfsCompletions,
      validFor: /^\w*$/,
    };
  }

  return null;
};

// ==========================
// Extension Factory
// ==========================

/**
 * Creates the Kit autocomplete extension for JavaScript language
 * @returns CodeMirror extension with JavaScript-specific completions
 */
export const kitAutocomplete = () => {
  console.log("Kit autocomplete extension initialized");
  return javascriptLanguage.data.of({
    autocomplete: kitCompletionSource,
  });
};
