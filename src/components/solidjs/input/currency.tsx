import { InputWrapper } from "./util";

/**
 * Currency input component for Euro amounts
 * @param label - Optional label text
 * @param description - Optional description text
 * @param placeholder - Placeholder text
 * @param icon - Icon shown when not focused (default: "ti ti-currency-euro")
 * @param activeIcon - Icon shown when focused (default: "ti ti-pencil")
 * @param value - Reactive value getter in cents
 * @param onChange - Called when value changes (receives value in cents)
 * @param error - Reactive error message getter
 * @param required - Show required asterisk after label
 * @param min - Minimum value in cents
 * @param max - Maximum value in cents
 */
const CurrencyInput = ({
  label,
  description,
  placeholder = "0,00 €",
  icon = "ti ti-currency-euro",
  activeIcon = "ti ti-pencil",
  value,
  onChange,
  error,
  required = false,
  min,
  max,
}: {
  label?: string;
  description?: string;
  placeholder?: string;
  icon?: string;
  activeIcon?: string;
  value?: () => number | undefined | null;
  onChange?: (cents: number) => void;
  error?: () => string | undefined;
  required?: boolean;
  min?: number;
  max?: number;
}) => {
  // Format cents to display string (e.g., 1234 -> "12,34")
  const formatValue = (cents: number | undefined | null): string => {
    if (cents === undefined || cents === null) return "";
    if (cents === 0) return "0,00";
    return (cents / 100).toFixed(2).replace(".", ",");
  };

  // Parse input string to cents (e.g., "12,34" -> 1234)
  const parseToCents = (input: string): number | null => {
    // Remove all spaces and replace comma with dot
    const cleaned = input.trim().replace(/\s/g, "").replace(",", ".");

    // Remove currency symbol if present
    const withoutSymbol = cleaned.replace("€", "").trim();

    // Parse to float
    const euros = parseFloat(withoutSymbol);

    if (isNaN(euros)) return null;

    // Convert to cents and round
    let cents = Math.round(euros * 100);

    // Apply min/max constraints
    if (min !== undefined && cents < min) cents = min;
    if (max !== undefined && cents > max) cents = max;

    return cents;
  };

  const handleChange = (input: string) => {
    if (!input) {
      onChange?.(0);
      return;
    }

    const cents = parseToCents(input);
    if (cents !== null) {
      onChange?.(cents);
    }
  };

  return (
    <InputWrapper
      label={label}
      description={description}
      error={error}
      required={required}
    >
      {({ inputId, ariaDescribedBy }) => (
        <div class="flex gap-2">
          <div class="group relative flex-1">
            <div class="absolute inset-y-0 left-3 flex items-center text-gray-500">
              <i class={`${icon} group-focus-within:hidden`} />
              <i
                class={`${activeIcon} hidden text-blue-500 group-focus-within:block`}
              />
            </div>

            <input
              id={inputId}
              type="text"
              class="input-subtle w-full p-2 pl-9"
              placeholder={placeholder}
              value={formatValue(value?.())}
              onChange={(e) => handleChange(e.target.value)}
              onBlur={(e) => {
                // Reformat on blur to ensure consistent display
                const cents = value?.();
                if (cents !== undefined && cents !== null) {
                  e.target.value = formatValue(cents);
                }
              }}
              aria-label={!label ? "Betrag in Euro" : undefined}
              aria-describedby={ariaDescribedBy}
              aria-invalid={!!error?.()}
              aria-required={required}
              inputMode="decimal"
            />
          </div>
        </div>
      )}
    </InputWrapper>
  );
};

export default CurrencyInput;
