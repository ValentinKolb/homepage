import { InputWrapper } from "./util";

/**
 * Text input component with optional multiline support
 * @param label - Optional label text
 * @param description - Optional description text
 * @param placeholder - Placeholder text
 * @param icon - Icon shown when not focused
 * @param activeIcon - Icon shown when focused
 * @param value - Reactive value getter
 * @param onChange - Called on change event
 * @param onInput - Called on input event
 * @param error - Reactive error message getter
 * @param multiline - Enable textarea mode
 * @param required - Show required asterisk after label
 */
const TextInput = ({
  label,
  description,
  placeholder,
  icon = "ti ti-cursor-text",
  activeIcon = "ti ti-pencil",
  value,
  onChange,
  onInput,
  error,
  multiline = false,
  required = false,
}: {
  label?: string;
  description?: string;
  placeholder?: string;
  icon?: string;
  activeIcon?: string;
  value?: () => string | undefined | null;
  onChange?: (value: string) => void;
  onInput?: (value: string) => void;
  error?: () => string | undefined;
  multiline?: boolean;
  required?: boolean;
}) => {
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
            <div
              class={`absolute inset-y-0 left-3 flex text-gray-500 ${multiline ? "top-2.5 items-start" : "items-center"}`}
            >
              <i class={`${icon} group-focus-within:hidden`} />
              <i
                class={`${activeIcon} hidden text-blue-500 group-focus-within:block`}
              />
            </div>
            {multiline ? (
              <textarea
                id={inputId}
                class="input-subtle h-20 max-h-50 min-h-15 w-full p-2 pl-9 md:max-h-30"
                placeholder={placeholder}
                onChange={(e) => onChange?.(e.target.value.trim())}
                onInput={(e) => onInput?.(e.target.value.trim())}
                aria-label={!label ? placeholder : undefined}
                aria-describedby={ariaDescribedBy}
                aria-invalid={!!error?.()}
                aria-required={required}
              >
                {value?.() ?? ""}
              </textarea>
            ) : (
              <input
                id={inputId}
                type="text"
                class="input-subtle w-full p-2 pl-9"
                placeholder={placeholder}
                value={value?.() ?? ""}
                onChange={(e) => onChange?.(e.target.value.trim())}
                onInput={(e) => onInput?.(e.target.value.trim())}
                aria-label={!label ? placeholder : undefined}
                aria-describedby={ariaDescribedBy}
                aria-invalid={!!error?.()}
                aria-required={required}
              />
            )}
          </div>
        </div>
      )}
    </InputWrapper>
  );
};

export default TextInput;
