/**
 * Kit API Type Definitions
 *
 * Core types for the Kit API that provides utilities for interactive pad development.
 */

import type { createDateAPI } from "./kit-date";
import type { createDbAPI } from "./kit-db";
import type { createDialogAPI } from "./kit-dialog";
import type { createFileAPI } from "./kit-files";
import type { createUtilsAPI } from "./kit-utils";
import type { createSheetAPI } from "./kit-sheet";
import type { createOpfsAPI } from "./kit-opfs";
import type { createStoreAPI } from "./kit-store";

export const KIT_INTERRUPT = Symbol("KIT_INTERRUPT");

// ==========================
// Core Types
// ==========================

/**
 * Generic upload result
 */
export type UploadResult = {
  name: string;
  size: number;
  type: string;
  buffer: Promise<ArrayBuffer>; // Raw content (string, Blob, parsed JSON, etc.)
};

// ==========================
// Kit API Interface
// ==========================

/**
 * Main Kit API interface exposed as global `kit` object
 */
export type KitAPI = {
  // Prompt, Alert, Confirm
  dialog: ReturnType<typeof createDialogAPI>;

  // File Operations
  file: ReturnType<typeof createFileAPI>;

  // Utilities
  util: ReturnType<typeof createUtilsAPI>;

  // Database API
  db: ReturnType<typeof createDbAPI>;

  // Dates
  date: ReturnType<typeof createDateAPI>;

  // Sheet/CSV
  sheet: ReturnType<typeof createSheetAPI>;

  // OPFS
  opfs: ReturnType<typeof createOpfsAPI>;

  // Store
  store: ReturnType<typeof createStoreAPI>;

  // Finalize Kit API
  _finalize(): Promise<void>;
};
