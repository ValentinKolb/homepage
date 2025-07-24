import { onCleanup } from "solid-js";

/**
 * Creates an interval with control methods for starting, stopping, and status checking.
 * Automatically cleans up when the SolidJS component unmounts.
 *
 * @param callback - The function to execute repeatedly at each interval
 * @param delay - The number of milliseconds between each execution
 * @param options - Configuration options for the interval behavior
 * @param options.autoStart - If true, starts the interval immediately when created (default: true)
 * @param options.executeImmediately - If true, executes the callback once immediately when started (default: true)
 * @returns Object with interval control methods
 *
 * @example
 * ```tsx
 * // Basic usage
 * const { start, stop, isRunning } = createInterval(
 *   () => console.log("Tick:", Date.now()),
 *   1000
 * );
 *
 * // Manual control
 * const { start, stop, execute, isRunning } = createInterval(
 *   () => fetchUpdates(),
 *   2000,
 *   { autoStart: false, executeImmediately: false }
 * );
 *
 * // Manual control
 * start(); // Begin interval
 * stop();  // Stop interval
 * execute(); // Run callback once without affecting interval
 *
 * // Status checking
 * if (isRunning()) {
 *   console.log("Timer is active");
 * }
 * ```
 */
export function createInterval(
  callback: () => void,
  delay: number,
  options: {
    autoStart?: boolean;
    executeImmediately?: boolean;
  } = { autoStart: true, executeImmediately: true },
): {
  start: () => void;
  stop: () => void;
  execute: () => void;
  isRunning: () => boolean;
} {
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const stop = () => {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  const execute = () => {
    callback();
  };

  const start = () => {
    stop();
    if (options.executeImmediately) {
      execute();
    }
    intervalId = setInterval(callback, delay);
  };

  const isRunning = (): boolean => {
    return intervalId !== null;
  };

  onCleanup(() => {
    stop();
  });

  if (options.autoStart) {
    start();
  }

  return {
    start,
    stop,
    execute,
    isRunning,
  };
}
