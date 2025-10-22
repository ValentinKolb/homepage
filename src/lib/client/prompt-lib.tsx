/**
 * Minimal dialog library for alert, confirm, prompt, and custom dialogs
 * @module prompt-lib
 */

import NumberInput from "@/components/solidjs/input/number";
import TextInput from "@/components/solidjs/input/text";
import { createSignal, type JSX } from "solid-js";
import { render } from "solid-js/web";

/**
 * Configuration options for dialog appearance and behavior
 */
export interface DialogOptions {
  /** Optional title displayed in the dialog header */
  title?: string;
  /** Optional icon class for header (e.g., "ti ti-trash") */
  icon?: string;
  /** Custom text for the confirm/OK button*/
  confirmText?: string;
  /** Custom text for the cancel button*/
  cancelText?: string;
}

/** Visual variant affecting button and outline colors */
type DialogVariant = "danger" | "primary" | "success";

export const DialogHeader = (props: {
  close: () => void;
  title?: string;
  icon?: string;
}) => {
  const { title, icon, close } = props || {};
  return (
    <div class="flex flex-row items-center justify-start gap-4 border-b-1 border-gray-200 pb-2 dark:border-gray-700">
      {icon && <i class={`${icon}`} />}
      {title && <p class="truncate font-semibold">{title}</p>}
      <button
        onClick={() => close()}
        class="ti ti-x ml-auto"
        aria-label="close dialog"
      />
    </div>
  );
};

class DialogManager {
  public dialogElement?: HTMLDialogElement;

  getDialog(variant?: DialogVariant): HTMLDialogElement {
    // Check if dialog exists but is no longer in the DOM (e.g., after view transition)
    if (this.dialogElement && !document.body.contains(this.dialogElement)) {
      this.dialogElement = undefined;
    }

    if (!this.dialogElement) {
      this.dialogElement = document.createElement("dialog");
      document.body.appendChild(this.dialogElement);
    }

    // Base classes
    let className =
      "rounded bg-white dark:bg-gray-900 fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 p-4 backdrop:bg-black/50 backdrop:backdrop-blur-sm";

    // Add colored outline based on variant
    if (variant === "danger") {
      className += " ring-2 ring-red-500";
    } else if (variant === "success") {
      className += " ring-2 ring-green-500";
    }

    this.dialogElement.className = className;
    return this.dialogElement;
  }

  /**
   * Shows a dialog with a custom SolidJS component
   * @param componentFactory - Function that receives close callback and returns JSX
   * @returns Promise that resolves to the result passed to close, or undefined if cancelled
   */
  dialog<T = void>(
    component: (close: (result: T) => void) => JSX.Element,
    variant?: DialogVariant,
  ): Promise<T | undefined> {
    const dialog = this.getDialog(variant);
    dialog.innerHTML = "";

    // Create container for SolidJS component
    const container = document.createElement("div");
    container.className = "text-base text-gray-800 dark:text-gray-200";
    dialog.appendChild(container);

    return new Promise((resolve) => {
      let dispose: (() => void) | undefined;

      const close = (result?: T) => {
        dispose?.();
        dialog.close();
        // Delay resolve to allow pending operations to complete
        setTimeout(() => resolve(result));
      };

      // Render the SolidJS component
      dispose = render(() => component(close), container);

      dialog.oncancel = (e) => {
        e.preventDefault();
        close(undefined);
      };

      dialog.showModal();
    });
  }
}

const manager = new DialogManager();

/**
 * Simple dialog utilities for user interactions
 *
 * @example
 * ```typescript
 * // Simple alert
 * await prompts.alert("File saved!");
 *
 * // Alert with options
 * await prompts.alert("Operation completed", {
 *   title: "Success",
 *   icon: "ti ti-check",
 *   variant: "success"
 * });
 *
 * // Confirmation dialog
 * const confirmed = await prompts.confirm("Delete this item?", {
 *   variant: "danger",
 *   confirmText: "Delete"
 * });
 *
 * // Prompt for input
 * const name = await prompts.prompt("Enter your name:");
 * if (name) {
 *   console.log(`Hello, ${name}!`);
 * }
 *
 * // Custom dialog with SolidJS component
 * const result = await prompts.dialog<{name: string, age: number}>((close) => (
 *   <div>
 *     <h2 class="text-lg font-semibold mb-4">Benutzerdaten</h2>
 *     <form onSubmit={(e) => {
 *       e.preventDefault();
 *       const data = new FormData(e.currentTarget);
 *       close({
 *         name: data.get("name") as string,
 *         age: parseInt(data.get("age") as string)
 *       });
 *     }}>
 *       <input name="name" class="input-simple mb-2 w-full" placeholder="Name" required />
 *       <input name="age" type="number" class="input-simple mb-4 w-full" placeholder="Alter" required />
 *       <div class="flex justify-end gap-3">
 *         <button type="button" class="btn-subtle" onClick={() => close()}>
 *           Abbrechen
 *         </button>
 *         <button type="submit" class="btn-primary">
 *           Speichern
 *         </button>
 *       </div>
 *     </form>
 *   </div>
 * ));
 * ```
 */
export const prompts = {
  /**
   * Display an alert dialog with a single OK button
   * @param content - Message to display (supports HTML)
   * @param options - Optional styling and text configuration
   * @returns Promise that resolves when dialog is closed
   */
  alert: (content: string | HTMLElement, options?: DialogOptions) =>
    manager.dialog((close) => (
      <div>
        <DialogHeader
          title={options?.title || "Info"}
          icon={options?.icon}
          close={close}
        />

        <div class="font-xs py-4 text-sm">{content}</div>

        <div class="flex justify-end gap-3">
          <button onClick={() => close()} class="btn-primary px-4 py-2">
            {options?.confirmText || "ESC"}
          </button>
        </div>
      </div>
    )),

  /**
   * Display a confirmation dialog with OK and Cancel buttons
   * @param content - Question/message to display
   * @param options - Optional styling and text configuration
   * @returns Promise resolving to true if confirmed, false if cancelled
   */
  confirm: (content: string, options?: DialogOptions) =>
    manager.dialog<boolean>((close) => (
      <div>
        <DialogHeader
          title={options?.title}
          icon={options?.icon}
          close={() => close(false)}
        />

        <div class="font-xs py-4 text-sm">{content}</div>

        <div class="flex justify-end gap-3">
          <button onClick={() => close(false)} class="btn-secondary px-4 py-2">
            {options?.cancelText || "Nein"}
          </button>
          <button onClick={() => close(true)} class="btn-success px-4 py-2">
            {options?.confirmText || "Ja"}
          </button>
        </div>
      </div>
    )),

  /**
   * Display a prompt dialog with text input
   * @param content - Prompt message
   * @param defaultValue - Initial value for the input field
   * @param options - Optional styling and text configuration
   * @returns Promise resolving to entered text (empty string is possible), or null if dialog was cancelled
   */
  prompt: (content: string, defaultValue?: string, options?: DialogOptions) =>
    manager.dialog<string | null>((close) => {
      const [value, setValue] = createSignal(defaultValue || undefined);
      return (
        <div class="flex flex-col gap-4">
          <DialogHeader
            title={options?.title}
            icon={options?.icon}
            close={() => close(null)}
          />

          <div class="font-xs text-sm">{content}</div>

          <TextInput
            value={value}
            onChange={setValue}
            aria-label={content || "Enter text"}
          />

          <div class="flex justify-end gap-3">
            <button onClick={() => close(null)} class="btn-secondary px-4 py-2">
              {options?.cancelText || "Abbrechen"}
            </button>
            <button
              onClick={() => close(value() ?? "")}
              class="btn-primary px-4 py-2"
            >
              {options?.confirmText || "OK"}
            </button>
          </div>
        </div>
      );
    }),

  /**
   * Display a prompt dialog with number input
   * @param content - Prompt message
   * @param defaultValue - Initial value for the input field
   * @param options - Optional styling and text configuration
   * @returns Promise resolving to entered number, or null if cancelled/empty
   */
  promptNumber: async (
    content: string,
    defaultValue?: number,
    options?: DialogOptions,
  ) =>
    manager.dialog<number | null>((close) => {
      const [value, setValue] = createSignal(defaultValue || 0);
      return (
        <div class="flex flex-col gap-4">
          <DialogHeader
            title={options?.title}
            icon={options?.icon}
            close={() => close(null)}
          />

          <div class="font-xs text-sm">{content}</div>

          <NumberInput
            value={value}
            onChange={setValue}
            aria-label={content || "Enter number"}
          />

          <div class="flex justify-end gap-3">
            <button onClick={() => close(null)} class="btn-secondary px-4 py-2">
              {options?.cancelText || "Abbrechen"}
            </button>
            <button
              onClick={() => close(value() ?? null)}
              class="btn-primary px-4 py-2"
            >
              {options?.confirmText || "OK"}
            </button>
          </div>
        </div>
      );
    }),

  /**
   * Display a custom dialog with a SolidJS component
   * @param componentFactory - Function that receives close callback and returns JSX
   * @returns Promise resolving to the result passed to close, or undefined if cancelled
   *
   * @example
   * ```typescript
   * const confirmed = await prompts.dialog<boolean>((close) => (
   *   <div class="p-4">
   *     <p class="mb-4">Bist du sicher?</p>
   *     <div class="flex gap-2">
   *       <button onClick={() => close(false)} class="btn-subtle">Nein</button>
   *       <button onClick={() => close(true)} class="btn-primary">Ja</button>
   *     </div>
   *   </div>
   * ));
   * ```
   */
  dialog: <T = any,>(component: (close: (result?: T) => void) => JSX.Element) =>
    manager.dialog(component),

  /**
   * Wrapper around the alert dialog with error styling and icon
   * @param content - Error message to display (supports HTML)
   * @param options - Optional styling and text configuration
   * @returns Promise that resolves when dialog is closed
   */
  error: (content: string | HTMLElement, options?: DialogOptions) =>
    manager.dialog(
      (close) => (
        <div>
          <DialogHeader
            title={options?.title ?? "Fehler"}
            icon={options?.icon ?? "ti ti-alert-circle"}
            close={close}
          />

          <div class="font-xs p-4 text-sm">{content}</div>

          <div class="flex justify-end gap-3">
            <button onClick={() => close()} class="btn-primary px-4 py-2">
              {options?.confirmText || "Schließen"}
            </button>
          </div>
        </div>
      ),
      "danger",
    ),

  getDialogElement: manager.getDialog,
};
