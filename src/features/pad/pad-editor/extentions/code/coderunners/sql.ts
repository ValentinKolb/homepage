/**
 * SQL Code Runner
 *
 * Executes SQL queries using the global Kit database
 */

import type { CodeRunner } from ".";
import type { Output } from "./output-builder";
import { getKitAPI } from "./kit";

export const sqlRunner: CodeRunner = {
  language: "sql",

  async execute(code: string, output: Output) {
    try {
      const kit = getKitAPI();

      // Execute SQL query
      const results = await kit.db.exec(code);

      // Display results
      if (Array.isArray(results) && results.length > 0) {
        output.table(results);
      } else {
        output.text("Success (zero rows returned)", "info");
      }

      await kit._finalize();
    } catch (error) {
      output.text(`[SQL] ${error}`, "error");
    }
  },
};
