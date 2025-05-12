import { createSignal } from "solid-js";

/**
 * A custom hook for copying text to the clipboard.
 *
 * @param timeout - The time (in milliseconds) after which the `wasCopied` signal resets to false (default is 2000ms).
 * @returns An object containing:
 *   - copy: an async function to copy a given text to the clipboard.
 *   - wasCopied: a signal that is true immediately after a successful copy, and resets to false after the timeout.
 */
export function createClipboard(timeout: number = 2000) {
  // Signal to indicate if text was successfully copied.
  const [wasCopied, setWasCopied] = createSignal(false);

  /**
   * Copies the provided text to the clipboard.
   *
   * @param text - The text to copy.
   */
  async function copy(text: string): Promise<void> {
    try {
      // Use the Clipboard API to write the text.
      await navigator.clipboard.writeText(text);
      // Set the signal to true on successful copy.
      setWasCopied(true);
      // After the specified timeout, reset the signal to false.
      setTimeout(() => {
        setWasCopied(false);
      }, timeout);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  }

  return { copy, wasCopied };
}
