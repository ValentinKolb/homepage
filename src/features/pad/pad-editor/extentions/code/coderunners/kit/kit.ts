/**
 * Kit API
 *
 * Main entry point that assembles all Kit APIs
 */

import { createDialogAPI } from "./kit-dialog";
import { createFileAPI } from "./kit-files";
import { createDbAPI } from "./kit-db";
import { createUtilsAPI } from "./kit-utils";
import { createDateAPI } from "./kit-date";
import { createSheetAPI } from "./kit-sheet";
import { createOpfsAPI } from "./kit-opfs";
import { createStoreAPI } from "./kit-store";
import type { KitAPI } from "./kit-types";

// Global Kit Instance
let kitInstance: KitAPI | null = null;

export const getKitAPI = () => {
  if (!kitInstance) {
    const dialog = createDialogAPI();
    const file = createFileAPI();
    const db = createDbAPI();
    const util = createUtilsAPI();
    const date = createDateAPI();
    const sheet = createSheetAPI();
    const opfs = createOpfsAPI();
    const store = createStoreAPI();

    kitInstance = {
      dialog,
      file,
      db,
      util,
      date,
      sheet,
      opfs,
      store,

      // Internal
      _finalize: async () => {
        // Finalize downloads
        await file.finalize();
      },
    };
  }
  return kitInstance;
};
