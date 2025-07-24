import { createDownloadLink } from "@/lib/client/files";
import { Output, type CodeRunner } from "..";
import { parseCommands } from "./commands";
import { getGlobalDatabase, deleteDatabaseFromStorage } from "./database";
import { handleImport, sqlResultsToCsv } from "./import-export";
import { createDatabaseInfoDisplay, sqlResultToHtmlTable } from "./ui";

const maxShow = 100;

export const sqlRunner: CodeRunner = {
  language: "sql",

  async execute(code: string, output: Output) {
    try {
      // Parse special commands
      const commands = parseCommands(code);

      // Get or create global database
      const { db, message, dbKey } = await getGlobalDatabase(commands.load);

      output.appendString(message, {
        level: "info",
      });

      // Handle delete command
      if (commands.delete) {
        try {
          deleteDatabaseFromStorage(commands.delete.dbName);
          output.appendString(
            `Deleted database '${commands.delete.dbName}' from storage`,
            { level: "info" },
          );
        } catch (error) {
          output.appendString(
            `Failed to delete database '${commands.delete.dbName}': ${error}`,
            { level: "error" },
          );
        }
      }

      // Handle show info command
      if (commands.showInfo) {
        output
          .appendSection()
          .appendElement(
            createDatabaseInfoDisplay(
              db,
              dbKey,
              commands.showInfo.mode,
            ).getElement(),
          );
      }

      // Handle imports
      commands.imports.forEach(async (importCmd) => {
        try {
          output.appendString(
            `Select FILE to import as '${importCmd.tablename}'`,
            { level: "info" },
          );

          const result = await handleImport(importCmd, db);
          output.appendString(result.message, { level: "info" });
        } catch (error) {
          output.appendString(`Import error: ${error}`, { level: "error" });
        }
      });

      // Execute SQL
      const results = db.exec(code);

      if (results.length == 0) {
        output.appendString(
          "Query executed successfully (no results returned)",
          { level: "info" },
        );
      }

      // Display results

      results.forEach((res, i) => {
        const section = output.appendSection();
        const length = res.values.length;
        section.appendString(
          `Query ${i + 1} Result: ${length} row${length == 1 ? "" : "s"} returned${length > maxShow ? ` ... showing first ${maxShow} rows` : ""}`,
        );
        // Print the table
        section.appendElement(sqlResultToHtmlTable(res, maxShow));
      });

      // Add database download link

      const downloadSection = output.appendSection();
      downloadSection.appendString("Actions");

      // Links for all query results
      results.forEach((res, i) =>
        downloadSection.appendElement(
          createDownloadLink(
            sqlResultsToCsv(res),
            `query_${i + 1}_result.csv`,
            "text/csv",
            `Query ${i + 1} Result (.csv)`,
            "hover-text no-underline before:content-['\\ea96'] before:mr-1 before:font-['tabler-icons']",
          ),
        ),
      );

      // Link to download the whole db
      downloadSection.appendElement(
        createDownloadLink(
          db.export(),
          `${dbKey}_dump.db`,
          "application/x-sqlite3",
          "Export Database (.db)",
          "hover-text no-underline before:content-['\\ea96'] before:mr-1 before:font-['tabler-icons']",
        ),
      );
    } catch (error) {
      output.appendString(`SQL Error: ${error}`, { level: "error" });
    }
  },
};
