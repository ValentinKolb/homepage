import type { CodeRunner } from ".";
import type { Output } from "./output-builder";
import { getKitAPI, KIT_INTERRUPT } from "./kit";

export const javascriptRunner: CodeRunner = {
  language: "javascript",

  async execute(code: string, output: Output) {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;
    const originalTable = console.table;
    const originalTime = console.time;
    const originalTimeEnd = console.timeEnd;
    const originalProgress = (console as any).progress;

    const s = (...args: any[]) =>
      args
        .map((arg) =>
          typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg),
        )
        .join(" ");

    // Override console methods
    console.log = (...args) => output.text(s(...args));
    console.error = (...args) => output.text(s(...args), "error");
    console.warn = (...args) => output.text(s(...args), "warn");
    console.info = (...args) => output.text(s(...args), "info");
    console.table = (data: any) => output.table(data);

    // Track timers
    const timers = new Map<string, number>();
    console.time = (label: string = "default") => {
      timers.set(label, performance.now());
    };
    console.timeEnd = (label: string = "default") => {
      const start = timers.get(label);
      if (!start) return;
      const dur = performance.now() - start;
      const timeStr = `${dur.toFixed(2)}ms${dur >= 1000 ? ` (${(dur / 1000).toFixed(2)}s)` : ""}`;
      output.text(`[Timer] ${label}: ${timeStr}`, "info");
      timers.delete(label);
    };

    // Add progress bar support
    (console as any).progress = (label: string, percent: number) => {
      output.progress(label, percent);
    };

    try {
      // Get the Kit API instance
      const kit = getKitAPI();

      // Create a function that includes kit API as a parameter
      const AsyncFunction = Object.getPrototypeOf(
        async function () {},
      ).constructor;
      const userCode = new AsyncFunction("kit", code);

      // Execute with kit API as argument
      const result = await userCode(kit);

      // Print result if defined
      if (result !== undefined) output.text(s(result), "info");

      // Auto-finalize Kit API
      await kit._finalize();
    } catch (error) {
      output.text(
        `${error === KIT_INTERRUPT ? "[interrupted]" : error instanceof Error ? error.message : String(error)}`,
        "error",
      );
    } finally {
      // Restore original console methods
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      console.info = originalInfo;
      console.table = originalTable;
      console.time = originalTime;
      console.timeEnd = originalTimeEnd;
      (console as any).progress = originalProgress;
    }
  },
};
