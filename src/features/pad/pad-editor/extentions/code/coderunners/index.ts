import { javascriptRunner } from "./javascript";
import { sqlRunner } from "./sql";
import { Output } from "./output-builder";

// Runner Registry
const runners: Record<string, CodeRunner> = {
  javascript: javascriptRunner,
  js: javascriptRunner, // Alias
  sql: sqlRunner,
};

export interface CodeRunner {
  language: string;
  execute: (code: string, output: Output) => Promise<void>;
  initialize?: () => Promise<void>;
  isInitialized?: () => boolean;
  addControls?: (output: Output) => void;
}

export const executeCodeSupportedLanguages = Object.keys(runners);

export function createCodeRunner(opts: {
  language: string;
  code: string;
  output: Output;
}) {
  const runner = runners[opts.language.toLowerCase()];
  if (!runner) {
    opts.output.show();
    opts.output.text(`Language '${opts.language}' is not supported`, "error");
    return;
  }

  return async () => {
    opts.output.clear();
    opts.output.show();
    const section = opts.output.new({});

    try {
      if (runner.initialize && !runner.isInitialized?.()) {
        section.text(`Module '${runner.language}' initializing...`, "info");
        section.show();
        await runner.initialize();
      }
      await runner.execute(opts.code, section);
      return true;
    } catch (error) {
      section.text(`Error: ${error}`, "error");
    }
  };
}
