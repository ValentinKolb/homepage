// Command types
export interface ParsedCommands {
  load?: LoadCommand;
  imports: ImportCommand[];
  showInfo?: ShowInfoCommand;
  delete?: DeleteCommand;
}

// Abstract command base class
abstract class Command {
  static matches(command: string): boolean {
    throw new Error("Must implement matches method");
  }
  static parse(command: string): Command {
    throw new Error("Must implement parse method");
  }
}

// LOAD command
export class LoadCommand extends Command {
  constructor(
    public dbName: string,
    public source: "STORAGE" | "FILE", // default memory
    public path?: string,
    public saveToStorage?: boolean,
  ) {
    super();
  }

  static matches(command: string): boolean {
    return /^load\s+/i.test(command);
  }

  static parse(command: string): LoadCommand {
    // LOAD "name" FROM STORAGE
    const storageMatch = command.match(/^load\s+"([^"]+)"\s+from\s+storage$/i);
    if (storageMatch) {
      return new LoadCommand(storageMatch[1], "STORAGE");
    }

    // LOAD "name" FROM FILE [TO STORAGE]
    const fileMatch = command.match(
      /^load\s+"([^"]+)"\s+from\s+file(?:\s+to\s+storage)?$/i,
    );
    if (fileMatch) {
      const saveToStorage = /to\s+storage$/i.test(command);
      return new LoadCommand(fileMatch[1], "FILE", undefined, saveToStorage);
    }

    throw new Error(
      `Invalid LOAD syntax. Use: --? LOAD "name" FROM [STORAGE|FILE] [TO STORAGE]\nExample: --? LOAD "project" FROM FILE TO STORAGE`,
    );
  }
}

// IMPORT command
export class ImportCommand extends Command {
  constructor(
    public tablename: string,
    public overwrite: boolean,
  ) {
    super();
  }

  static matches(command: string): boolean {
    return /^import\s+/i.test(command);
  }

  static parse(command: string): ImportCommand {
    // IMPORT FILE AS "table" [OVERWRITE]
    const fileMatch = command.match(
      /^import\s+file\s+as\s+"([^"]+)"(?:\s+overwrite)?$/i,
    );
    if (fileMatch) {
      const overwrite = /overwrite$/i.test(command);
      return new ImportCommand(fileMatch[1], overwrite);
    }

    throw new Error(
      `Invalid IMPORT syntax. Use: --? IMPORT FILE AS "table" [OVERWRITE]\nExample: --? IMPORT FILE AS "sales"`,
    );
  }
}

// DELETE command
export class DeleteCommand extends Command {
  constructor(public dbName: string) {
    super();
  }

  static matches(command: string): boolean {
    return /^delete\s+/i.test(command);
  }

  static parse(command: string): DeleteCommand {
    const match = command.match(/^delete\s+"([^"]+)"$/i);
    if (match) {
      return new DeleteCommand(match[1]);
    }
    throw new Error(
      `Invalid DELETE syntax. Use: --? DELETE "name"\nExample: --? DELETE "old_project"`,
    );
  }
}

// SHOW INFO command
export class ShowInfoCommand extends Command {
  constructor(public mode: "SHORT" | "FULL") {
    super();
  }

  static matches(command: string): boolean {
    return /^show\s+info/i.test(command);
  }

  static parse(command: string): ShowInfoCommand {
    const match = command.match(/^show\s+info(?:\s+(short|full))?$/i);
    if (match) {
      const mode = (match[1]?.toUpperCase() || "SHORT") as "SHORT" | "FULL";
      return new ShowInfoCommand(mode);
    }
    throw new Error(
      `Invalid SHOW INFO syntax. Use: --? SHOW INFO [SHORT|FULL]\nExample: --? SHOW INFO FULL`,
    );
  }
}

// Command registry
const commandClasses = [
  LoadCommand,
  ImportCommand,
  DeleteCommand,
  ShowInfoCommand,
];

// Parser function
export function parseCommands(code: string): ParsedCommands {
  const result: ParsedCommands = {
    imports: [],
  };

  const lines = code.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("--?")) continue;

    // Remove --? and trim
    const command = trimmed.replace(/^--\?\s*/, "").trim();

    // Try each command class
    let parsed = false;
    for (const CommandClass of commandClasses) {
      if (CommandClass.matches(command)) {
        try {
          const parsedCommand = CommandClass.parse(command);
          if (parsedCommand instanceof LoadCommand) {
            result.load = parsedCommand;
          } else if (parsedCommand instanceof ImportCommand) {
            result.imports.push(parsedCommand);
          } else if (parsedCommand instanceof DeleteCommand) {
            result.delete = parsedCommand;
          } else if (parsedCommand instanceof ShowInfoCommand) {
            result.showInfo = parsedCommand;
          }
          parsed = true;
          break;
        } catch (error) {
          throw error; // Re-throw parser-specific errors with helpful messages
        }
      }
    }

    // If no parser matched, it's an unknown command
    if (!parsed) {
      throw new Error(
        `Unknown command: "${command}"\nSupported commands: LOAD, IMPORT, DELETE, SHOW INFO, EXPORT`,
      );
    }
  }

  return result;
}
