import type { CodeRunner, Output } from ".";

export const javascriptRunner: CodeRunner = {
  language: "javascript",

  async execute(code: string, output: Output) {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;

    // Override console methods
    console.log = (...args) => {
      output.appendString(
        args
          .map((arg) =>
            typeof arg === "object"
              ? JSON.stringify(arg, null, 2)
              : String(arg),
          )
          .join(" "),
      );
    };

    console.error = (...args) => {
      output.appendString(args.map(String).join(" "), { level: "error" });
    };

    console.warn = (...args) => {
      output.appendString(args.map(String).join(" "), { level: "info" });
    };

    console.info = (...args) => {
      output.appendString(args.map(String).join(" "), { level: "info" });
    };

    try {
      // Create a function to allow for both sync and async code
      const asyncWrapper = `
        (async function() {
          ${code}
        })()
      `;

      const result = await eval(asyncWrapper);

      if (result !== undefined) {
        output.appendString(
          typeof result === "object"
            ? JSON.stringify(result, null, 2)
            : String(result),
          { level: "info" },
        );
      }
    } catch (error) {
      output.appendString(`Error: ${error}`, { level: "error" });
    } finally {
      // Restore original console methods
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      console.info = originalInfo;
    }
  },
};
