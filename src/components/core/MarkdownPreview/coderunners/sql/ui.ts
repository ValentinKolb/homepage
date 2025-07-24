import type { Database } from "sql.js";
import { Output } from "..";

export interface TableColumn {
  header: string;
  key?: string;
  render?: (value: any) => string;
}

export interface TableOptions {
  maxRows?: number;
  alternatingCols?: boolean;
  className?: string;
  showRowCount?: boolean;
}

export function createDataTable(
  columns: TableColumn[],
  rows: any[],
  options: TableOptions = {},
): HTMLElement {
  const {
    maxRows = 100,
    alternatingCols = true,
    className = "",
    showRowCount = true,
  } = options;

  const container = document.createElement("div");
  container.className = `data-table-container ${className}`;

  if (rows.length === 0) {
    const noData = document.createElement("div");
    noData.textContent = "No rows returned";
    noData.className = "opacity-60 italic";
    container.appendChild(noData);
    return container;
  }

  // Row count header
  if (showRowCount) {
    const header = document.createElement("div");
    header.className = "text-sm opacity-60 mb-2";
    header.textContent = `${rows.length} rows returned`;
    container.appendChild(header);
  }

  // Create table
  const table = document.createElement("table");
  table.className =
    "w-full border-collapse border border-white/20 text-sm tabular-nums !m-0";

  // Table header
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  columns.forEach((column, colIndex) => {
    const th = document.createElement("th");
    const bgClass =
      alternatingCols && colIndex % 2 === 0 ? "bg-black/30" : "bg-black/20";
    th.className = `border border-white/10 text-left font-bold text-inherit ${bgClass}`;
    th.style.padding = "8px 12px";
    th.textContent = column.header;
    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Table body (limit rows for performance)
  const tbody = document.createElement("tbody");
  const rowsToShow = rows.slice(0, maxRows);

  rowsToShow.forEach((row) => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-black/40";

    columns.forEach((column, colIndex) => {
      const td = document.createElement("td");
      const bgClass =
        alternatingCols && colIndex % 2 === 0
          ? "bg-white/[0.05]"
          : "bg-black/[0.05]";
      td.className = `border border-white/10 ${bgClass}`;
      td.style.padding = "8px 12px";

      // Get cell value
      let cellValue = column.key ? row[column.key] : row[colIndex];

      // Apply custom renderer if provided
      if (column.render) {
        cellValue = column.render(cellValue);
      }

      // Format cell content - round numbers to 4 decimal places
      if (cellValue === null || cellValue === undefined) {
        td.textContent = "NULL";
        td.className += " opacity-50 italic";
      } else if (
        typeof cellValue === "number" &&
        !Number.isInteger(cellValue)
      ) {
        td.textContent = cellValue.toFixed(4).replace(/\.?0+$/, "");
      } else {
        td.textContent = String(cellValue);
      }

      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  container.appendChild(table);

  // Add truncation notice if needed
  if (rows.length > maxRows) {
    const notice = document.createElement("div");
    notice.className = "text-sm opacity-60 mt-2";
    notice.textContent = `... ${rows.length - maxRows} more rows (showing first ${maxRows})`;
    container.appendChild(notice);
  }

  return container;
}

export function sqlResultToHtmlTable(
  result: any,
  maxRows: number = 100,
): HTMLElement {
  const columns: TableColumn[] = result.columns.map((col: string) => ({
    header: col,
  }));

  return createDataTable(columns, result.values, {
    maxRows,
    showRowCount: false, // We handle this separately for SQL results
  });
}

interface DBTableInfo {
  name: string;
  schema?: DBColumnInfo[];
  rowCount?: number;
}

interface DBColumnInfo {
  name: string;
  type: string;
  notNull: boolean;
  defaultValue: any;
  primaryKey: boolean;
}

export function createDatabaseInfoDisplay(
  db: Database,
  dbName: string,
  mode: "SHORT" | "FULL",
): Output {
  const output = new Output(document.createElement("div"));

  // Collect all data for JSON export
  const jsonData = {
    name: dbName,
    tables: [],
  } as {
    name: string;
    tables: DBTableInfo[];
  };

  try {
    // Get all tables
    const tablesResult = db.exec(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
    );

    const tableNames =
      tablesResult.length > 0
        ? tablesResult[0].values.map((row) => row[0] as string)
        : [];

    // Basic info
    output.appendString(`Database: '${dbName}'`);
    output.appendString(`Tables: ${tableNames.length}`);

    // Show info per table
    for (const tableName of tableNames) {
      const tableContainer = output.appendSection();

      const tableData: DBTableInfo = {
        name: tableName,
        schema: [],
        rowCount: 0,
      };

      // Table name
      tableContainer.appendString(`Table '${tableName}'`);

      if (mode !== "FULL") {
        jsonData.tables.push({ name: tableName });
        continue;
      }

      // Get table schema
      const schemaResult = db.exec(`PRAGMA table_info("${tableName}")`);
      if (schemaResult.length > 0) {
        const schemaColumns: TableColumn[] = [
          { header: "Column" },
          { header: "Type" },
          { header: "Not Null" },
          { header: "Default" },
          { header: "Primary Key" },
        ];

        const schemaRows = schemaResult[0].values.map((row) => {
          const columnInfo: DBColumnInfo = {
            name: String(row[1]),
            type: String(row[2]),
            notNull: Boolean(row[3]),
            defaultValue: row[4],
            primaryKey: Boolean(row[5]),
          };
          tableData.schema!.push(columnInfo);

          return [
            row[1], // Column name
            row[2], // Type
            row[3] ? "yes" : "", // Not Null
            row[4] || "", // Default
            row[5] ? "yes" : "", // Primary Key
          ];
        });

        const schemaTable = createDataTable(schemaColumns, schemaRows, {
          showRowCount: false,
          alternatingCols: true,
        });

        tableContainer.appendElement(schemaTable);

        // Row count
        try {
          const countResult = db.exec(`SELECT COUNT(*) FROM "${tableName}"`);
          if (countResult.length > 0) {
            tableData.rowCount = countResult[0].values[0][0] as number;
            tableContainer.appendString(`${tableData.rowCount} rows`);
          }
        } catch (e) {
          // Ignore count errors
        }
      }
      jsonData.tables.push(tableData);
    }

    // Add JSON export button
    const exportButton = document.createElement("button");
    exportButton.className = "text-gray-200 hover:text-gray-500 underline";
    exportButton.textContent = "Copy schema as JSON";
    exportButton.addEventListener("click", () => {
      navigator.clipboard
        .writeText(JSON.stringify(jsonData, null, 2))
        .then(() => {
          exportButton.textContent = "Copied!";
          setTimeout(() => {
            exportButton.textContent = "Copy schema as JSON";
          }, 2000);
        });
    });
    output.appendElement(exportButton);
  } catch (error) {
    output.appendString(`Error reading database info: ${error}`, {
      level: "error",
    });
  }

  return output;
}
