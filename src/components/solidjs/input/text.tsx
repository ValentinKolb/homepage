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
  monospace = false,
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
  monospace?: boolean;
}) => {
  return (
    <div class="flex flex-col gap-2">
      {(label || description) && (
        <label for="text-input">
          {label && <p class="mb-1 block text-xs font-medium">{label}</p>}
          {description && (
            <p class="text-dimmed block text-xs">{description}</p>
          )}
        </label>
      )}

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
              id="text-input"
              class={`${monospace ? "font-mono" : ""} input-subtle h-20 max-h-50 min-h-15 w-full p-2 pl-9 md:max-h-30`}
              placeholder={placeholder}
              value={value?.() ?? ""}
              onChange={(e) => onChange?.(e.target.value.trim())}
              onInput={(e) => onInput?.(e.target.value.trim())}
            />
          ) : (
            <input
              id="text-input"
              type="text"
              class={`input-subtle w-full p-2 pl-9 ${monospace ? "font-mono" : ""}`}
              placeholder={placeholder}
              value={value?.() ?? ""}
              onChange={(e) => onChange?.(e.target.value.trim())}
              onInput={(e) => onInput?.(e.target.value.trim())}
            />
          )}
        </div>
      </div>

      {error?.() && <p class="text-sm text-red-500">{error()}</p>}
    </div>
  );
};

export default TextInput;
