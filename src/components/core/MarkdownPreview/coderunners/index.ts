import { nanoid } from "nanoid";
import { javascriptRunner } from "./javascript";
import { pythonRunner } from "./python";
import { sqlRunner } from "./sql";

// Runner Registry
const runners: Record<string, CodeRunner> = {
  python: pythonRunner,
  javascript: javascriptRunner,
  js: javascriptRunner, // Alias
  sql: sqlRunner,
};

export class Output {
  constructor(private container: HTMLElement) {
    this.container.classList.add("flex", "flex-col", "gap-2");
    this.container.id ||= nanoid();
  }

  id() {
    return this.container.id;
  }

  getHtml() {
    return this.container.innerHTML;
  }

  getElement() {
    return this.container;
  }

  removeElement(element: HTMLElement) {
    this.container.removeChild(element);
  }

  appendElement(element: HTMLElement) {
    this.container.appendChild(element);
  }

  appendSection(): Output {
    const section = document.createElement("div");
    section.classList.add("border", "border-gray-700", "p-2", "rounded");
    this.container.appendChild(section);
    return new Output(section);
  }

  appendString(
    str: string,
    options?: {
      level?: "default" | "error" | "info";
      additionalClasses?: string;
    },
  ) {
    const p = document.createElement("p");
    p.className = `!m-0 ${options?.additionalClasses || ""}`;
    if (options?.level === "error") {
      p.classList.add("text-red-400");
    } else if (options?.level === "info") {
      p.classList.add("text-blue-400");
    }
    p.textContent = str;
    this.container.appendChild(p);
  }
}

export interface CodeRunner {
  language: string;
  execute: (code: string, output: Output) => Promise<void>;
  initialize?: () => Promise<void>;
}

export const executeCodeSupportedLanguages = Object.keys(runners);

export async function executeCode(
  language: string,
  code: string,
  output: Output,
): Promise<boolean> {
  const runner = runners[language.toLowerCase()];

  if (!runner) {
    output.appendString(`Language '${language}' is not supported`, {
      level: "error",
    });
    return false;
  }

  try {
    if (runner.initialize) {
      output.appendString(`Module '${runner.language}' initializing...`, {
        level: "info",
      });
      await runner.initialize();
    }

    await runner.execute(code, output);
    return true;
  } catch (error) {
    output.appendString(`Error: ${error}`, {
      level: "error",
    });
    return false;
  }
}
