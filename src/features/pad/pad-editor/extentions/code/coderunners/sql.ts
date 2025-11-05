/**
 * SQL Code Runner
 *
 * Executes SQL queries using the global Kit database
 */

import type { CodeRunner } from ".";
import type { Output } from "./output-builder";
import { run } from "./javascript";

export const sqlRunner: CodeRunner = {
  language: "sql",

  async execute(code: string, output: Output) {
    return run(async (kit) => {
      // Execute SQL query
      const results = await kit.db.exec(code);

      // Display results
      if (Array.isArray(results) && results.length > 0) {
        output.table(results);
      } else {
        output.text("Success (zero rows returned)", "info");
      }
    }, output);
  },
};
