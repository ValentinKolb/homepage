import { onCleanup } from "solid-js";

/**
 * Creates a debounced function with additional control methods for manual triggering
 * and cancellation. Useful for more complex debouncing scenarios.
 *
 * @template T - The type signature of the callback function
 * @param callback - The function to debounce
 * @param delay - The number of milliseconds to delay execution
 * @returns Object with debounced function and control methods
 *
 * @example
 * ```tsx
 * const { debouncedFn, trigger, cancel, isPending } = createDebounce(
 *   (text: string) => console.log("Saving:", text),
 *   1000
 * );
 *
 * // Use normally
 * debouncedFn("hello");
 *
 * // Force immediate execution
 * trigger("immediate save");
 *
 * // Cancel pending execution
 * cancel();
 *
 * // Check if execution is pending
 * if (isPending()) {
 *   console.log("Save is pending...");
 * }
 * ```
 */
export function createDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
): {
  debouncedFn: (...args: Parameters<T>) => void;
  trigger: (...args: Parameters<T>) => void;
  cancel: () => void;
  isPending: () => boolean;
} {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  const trigger = (...args: Parameters<T>) => {
    cancel();
    callback(...args);
  };

  const isPending = (): boolean => {
    return timeoutId !== null;
  };

  onCleanup(() => {
    cancel();
  });

  const debouncedFn = (...args: Parameters<T>) => {
    cancel();
    timeoutId = setTimeout(() => {
      callback(...args);
      timeoutId = null;
    }, delay);
  };

  return {
    debouncedFn,
    trigger,
    cancel,
    isPending,
  };
}
