import { InputWrapper } from "./util";

/**
 * Number input component with increment/decrement buttons
 * @param label - Optional label text
 * @param description - Optional description text
 * @param placeholder - Placeholder text
 * @param value - Reactive number value getter
 * @param onChange - Called on change event
 * @param onInput - Called on input event
 * @param error - Reactive error message getter
 * @param max - Maximum allowed value (default: Infinity)
 * @param min - Minimum allowed value (default: -Infinity)
 * @param step - Step increment/decrement amount (default: 1)
 * @param required - Show required asterisk after label
 */
const NumberInput = ({
  label,
  description,
  placeholder,
  value = () => 0,
  onChange,
  onInput,
  error,
  max = Infinity,
  min = -Infinity,
  step = 1,
  required = false,
}: {
  label?: string;
  description?: string;
  placeholder?: string;
  value?: () => number | undefined;
  onChange?: (value: number) => void;
  onInput?: (value: number) => void;
  error?: () => string | undefined;
  max?: number;
  min?: number;
  step?: number;
  required?: boolean;
}) => {
  const parse = (value: string, applyConstraints: boolean = true) => {
    const parsed = parseInt(value);
    if (isNaN(parsed)) return min;
    // Only apply min/max constraints on change (blur), not on input
    return applyConstraints ? Math.max(min, Math.min(max, parsed)) : parsed;
  };

  return (
    <InputWrapper
      label={label}
      description={description}
      error={error}
      required={required}
    >
      {({ inputId, ariaDescribedBy }) => (
        <div class="flex flex-row flex-nowrap gap-3 text-nowrap">
          <button
            type="button"
            class={`btn btn-subtle ti ti-minus rounded-full p-2 px-3 ${(value() ?? -Infinity) <= min && "opacity-40"}`}
            aria-label="Wert verringern"
            onClick={() => onChange?.((value() ?? 0) - step)}
            disabled={(value() ?? -Infinity) <= min}
          />
          <div class="group relative flex-1">
            <input
              id={inputId}
              type="number"
              class={`input-base w-full p-2 text-center font-mono font-semibold ring-1 ring-gray-200 dark:ring-0`}
              placeholder={placeholder}
              value={value()}
              onChange={(e) => {
                const v = parse(e.currentTarget.value, true);
                onChange?.(v);
                e.currentTarget.value = `${v}`;
              }}
              onInput={(e) => {
                const v = parse(e.currentTarget.value, false);
                onInput?.(v);
              }}
              aria-label={!label ? placeholder || "Zahl eingeben" : undefined}
              aria-describedby={ariaDescribedBy}
              aria-invalid={!!error?.()}
              aria-required={required}
              aria-valuemin={min}
              aria-valuemax={max}
              aria-valuenow={value()}
            />
          </div>

          <button
            type="button"
            class={`btn btn-subtle ti ti-plus rounded-full p-2 px-3 ${(value() ?? Infinity) >= max && "opacity-40"}`}
            aria-label="Wert erhöhen"
            onClick={() => onChange?.((value() ?? 0) + step)}
            disabled={(value() ?? Infinity) >= max}
          />
        </div>
      )}
    </InputWrapper>
  );
};

export default NumberInput;
