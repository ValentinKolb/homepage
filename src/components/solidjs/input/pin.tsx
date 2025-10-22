import { For, onMount } from "solid-js";

type PinInputProps = {
  label?: string;
  description?: string;
  length?: number;
  value?: () => string;
  onChange?: (value: string) => void;
  error?: () => string | undefined;
  disabled?: boolean;
  stretch?: boolean;
};

const PinInput = ({
  label,
  description,
  length = 6,
  value = () => "",
  onChange,
  error,
  disabled = false,
  stretch = false,
}: PinInputProps) => {
  let inputRefs: HTMLInputElement[] = [];

  const handleChange = (index: number, newValue: string) => {
    if (disabled) return;

    // Only allow single digits
    const digit = newValue.slice(-1).replace(/[^0-9]/g, "");

    const currentValue = value();
    const before = currentValue.slice(0, index);
    const after = currentValue.slice(index + 1);

    onChange?.(before + digit + after);

    // Auto-focus next field
    if (digit && index < length - 1) {
      inputRefs[index + 1]?.focus();
      inputRefs[index + 1]?.select();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case "Backspace":
        if (!value()[index] && index > 0) {
          e.preventDefault();
          // Move to previous field and delete its content
          const currentValue = value();
          const before = currentValue.slice(0, index - 1);
          const after = currentValue.slice(index);
          onChange?.(before + after);
          inputRefs[index - 1]?.focus();
        }
        break;

      case "ArrowLeft":
        e.preventDefault();
        if (index > 0) {
          inputRefs[index - 1]?.focus();
          inputRefs[index - 1]?.select();
        }
        break;

      case "ArrowRight":
        e.preventDefault();
        if (index < length - 1) {
          inputRefs[index + 1]?.focus();
          inputRefs[index + 1]?.select();
        }
        break;
    }
  };

  const handlePaste = (e: ClipboardEvent) => {
    e.preventDefault();
    if (disabled) return;

    const pastedData = e.clipboardData?.getData("text") || "";
    const pastedDigits = pastedData.replace(/[^0-9]/g, "");

    if (pastedDigits.length > 0) {
      const startIndex = inputRefs.findIndex(
        (ref) => ref === document.activeElement,
      );
      const index = startIndex >= 0 ? startIndex : 0;

      const currentValue = value();
      const before = currentValue.slice(0, index);
      const pasted = pastedDigits.slice(0, length - index);
      const after = currentValue.slice(index + pasted.length);

      onChange?.(before + pasted + after);

      // Focus appropriate next field
      const nextIndex = Math.min(index + pasted.length, length - 1);
      inputRefs[nextIndex]?.focus();
      inputRefs[nextIndex]?.select();
    }
  };

  // Add paste listener on mount
  onMount(() => {
    const container = inputRefs[0]?.parentElement?.parentElement;
    if (container) {
      container.addEventListener("paste", handlePaste as any);
      return () => container.removeEventListener("paste", handlePaste as any);
    }
  });

  return (
    <div class="flex flex-col gap-2">
      {(label || description) && (
        <div>
          {label && (
            <p class="mb-1 block text-xs font-medium" id="pin-label">
              {label}
            </p>
          )}
          {description && (
            <p class="text-dimmed block text-xs" id="pin-description">
              {description}
            </p>
          )}
        </div>
      )}

      <div
        class="flex gap-1 md:gap-2"
        role="group"
        aria-labelledby={label ? "pin-label" : undefined}
        aria-describedby={
          description ? "pin-description" : error ? "pin-error" : undefined
        }
      >
        <For each={new Array(length).fill(0)}>
          {(_, index) => (
            <input
              ref={(el) => (inputRefs[index()] = el)}
              type="text"
              inputMode="numeric"
              pattern="[0-9]"
              maxLength={1}
              class={`input-subtle h-10 ${stretch ? "w-full" : "w-10"} text-center font-mono text-sm font-semibold transition-all ${value()[index()] ? "bg-gray-50 dark:bg-gray-800" : ""} ${disabled ? "cursor-not-allowed opacity-50" : ""} ${error ? "ring-1 ring-red-500" : ""} focus:ring-2 focus:ring-blue-500`}
              value={value()[index()] || ""}
              onInput={(e) => handleChange(index(), e.currentTarget.value)}
              onKeyDown={(e) => handleKeyDown(index(), e)}
              onFocus={(e) => e.currentTarget.select()}
              disabled={disabled}
              aria-label={`PIN Ziffer ${index() + 1} von ${length}`}
              aria-invalid={!!error}
              autocomplete="off"
            />
          )}
        </For>
      </div>

      {error?.() && <p class="text-sm text-red-500">{error()}</p>}
    </div>
  );
};

export default PinInput;
