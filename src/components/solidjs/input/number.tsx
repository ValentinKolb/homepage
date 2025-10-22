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
}) => {
  const parse = (value: string) => {
    const parsed = parseInt(value);
    return isNaN(parsed) ? min : Math.max(min, Math.min(max, parsed));
  };

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
      <div class="flex flex-row flex-nowrap gap-3 text-nowrap">
        <button
          class={`btn btn-subtle ti ti-minus rounded-full p-2 px-3 ${(value() ?? -Infinity) <= min && "opacity-40"}`}
          aria-label="Decrease Value"
          onClick={() => onChange?.((value() ?? 0) - step)}
          disabled={(value() ?? -Infinity) <= min}
        />
        <div class="group relative flex-1">
          <input
            id="text-input"
            type="number"
            class={`input-base w-full p-2 text-center font-mono font-semibold ring-1 ring-gray-200 dark:ring-0`}
            placeholder={placeholder}
            value={value()}
            onChange={(e) => {
              const v = parse(e.currentTarget.value);
              onChange?.(v);
              e.currentTarget.value = `${v}`;
            }}
            onInput={(e) => {
              const v = parse(e.currentTarget.value);
              onInput?.(v);
              e.currentTarget.value = `${v}`;
            }}
          />
        </div>

        <button
          class={`btn btn-subtle ti ti-plus rounded-full p-2 px-3 ${(value() ?? Infinity) >= max && "opacity-40"}`}
          aria-label="Increase Value"
          onClick={() => onChange?.((value() ?? 0) + step)}
          disabled={(value() ?? Infinity) >= max}
        />
      </div>

      {error?.() && <p class="text-sm text-red-500">{error()}</p>}
    </div>
  );
};

export default NumberInput;
