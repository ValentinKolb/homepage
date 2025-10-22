import DOMPurify from "dompurify";

const TagsInput = ({
  label,
  description,
  placeholder = "Tags (z.B. Tag 1, Tag 2,...)",
  icon = "ti ti-tag",
  activeIcon = "ti ti-pencil",
  value = () => [],
  onChange,
  error,
}: {
  label?: string;
  description?: string;
  placeholder?: string;
  icon?: string;
  activeIcon?: string;
  value?: () => string[];
  onChange?: (tags: string[]) => void;
  error?: () => string | undefined;
}) => {
  const renderTags = (tags: string[]) =>
    tags.length === 0
      ? `<span class="text-gray-400 dark:text-gray-500">${placeholder}</span>`
      : `<div class="flex flex-wrap gap-1">${tags
          .map(
            (tag) =>
              `<span class="min-w-0 max-w-[150px] truncate rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300">${tag}</span>`,
          )
          .join("")}</div>`;

  return (
    <div class="flex flex-col gap-2">
      {(label || description) && (
        <label for="tags-input">
          {label && <p class="mb-1 block text-xs font-medium">{label}</p>}
          {description && (
            <p class="text-dimmed block text-xs">{description}</p>
          )}
        </label>
      )}

      <div class="flex gap-2">
        <div class="group relative flex-1">
          <div
            class={`absolute inset-y-0 left-3 flex items-center text-gray-500`}
          >
            <i class={`${icon} group-focus-within:hidden`} />
            <i
              class={`${activeIcon} hidden text-blue-500 group-focus-within:block`}
            />
          </div>
          <div
            contentEditable
            id="tags-input"
            class={`input-subtle min-h-[38px] w-full cursor-text overflow-hidden p-2 pl-9 outline-none`}
            onFocus={(e) => {
              e.currentTarget.textContent = value?.().join(", ");
              const sel = getSelection();
              sel?.selectAllChildren(e.currentTarget); // move cursor to end
              sel?.collapseToEnd();
            }}
            onBlur={(e) => {
              const newTags = (e.currentTarget.textContent || "")
                .split(",")
                .map((t) => DOMPurify.sanitize(t.trim()))
                .filter(Boolean)
                .filter((tag, index, self) => self.indexOf(tag) === index); // unique
              onChange?.(newTags);
              e.currentTarget.innerHTML = renderTags(newTags);
            }}
            onKeyDown={(e) =>
              e.key === "Enter" && (e.preventDefault(), e.currentTarget.blur())
            }
            innerHTML={renderTags(value?.())}
          />
        </div>
      </div>

      {error?.() && <p class="text-sm text-red-500">{error()}</p>}
    </div>
  );
};

export default TagsInput;
