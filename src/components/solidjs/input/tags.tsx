import DOMPurify from "dompurify";
import { InputWrapper } from "./util";
import { createUniqueId } from "solid-js";

/**
 * Tags input component with comma-separated entry
 * @param label - Optional label text
 * @param description - Optional description text
 * @param placeholder - Placeholder text when no tags
 * @param icon - Icon shown when not focused
 * @param activeIcon - Icon shown when focused
 * @param value - Reactive string array getter
 * @param onChange - Called when tags change
 * @param error - Reactive error message getter
 * @param required - Show required asterisk after label
 */
const TagsInput = ({
  label,
  description,
  placeholder = "Tags (z.B. Tag 1, Tag 2,...)",
  icon = "ti ti-tag",
  activeIcon = "ti ti-pencil",
  value = () => [],
  onChange,
  error,
  required = false,
}: {
  label?: string;
  description?: string;
  placeholder?: string;
  icon?: string;
  activeIcon?: string;
  value?: () => string[];
  onChange?: (tags: string[]) => void;
  error?: () => string | undefined;
  required?: boolean;
}) => {
  const announcementId = createUniqueId();

  const renderTags = (tags: string[] | undefined) => {
    const tagList = tags || [];
    return tagList.length === 0
      ? `<span class="text-gray-400 dark:text-gray-500">${placeholder}</span>`
      : `<div class="flex flex-wrap gap-1">${tagList
          .map(
            (tag) =>
              `<span class="min-w-0 max-w-[150px] truncate rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300">${tag}</span>`,
          )
          .join("")}</div>`;
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
              id={inputId}
              class={`input-subtle min-h-[38px] w-full cursor-text overflow-hidden p-2 pl-9 outline-none`}
              role="textbox"
              aria-multiline="false"
              aria-label={!label ? placeholder || "Tags eingeben" : undefined}
              aria-describedby={ariaDescribedBy}
              aria-invalid={!!error?.()}
              aria-required={required}
              aria-placeholder={placeholder}
              onFocus={(e) => {
                const currentTags = value?.() || [];
                e.currentTarget.textContent = currentTags.join(", ");
                const sel = getSelection();
                sel?.selectAllChildren(e.currentTarget);
                sel?.collapseToEnd();
              }}
              onBlur={(e) => {
                const oldTags = value?.() || [];
                const newTags = (e.currentTarget.textContent || "")
                  .split(",")
                  .map((t) => DOMPurify.sanitize(t.trim()))
                  .filter(Boolean)
                  .filter((tag, index, self) => self.indexOf(tag) === index);

                // Announce changes to screen readers
                const added = newTags.filter((t) => !oldTags.includes(t));
                const removed = oldTags.filter((t) => !newTags.includes(t));

                if (added.length > 0 || removed.length > 0) {
                  const announcement = document.getElementById(announcementId);
                  if (announcement) {
                    let message = "";
                    if (added.length > 0) {
                      message += `Tags hinzugefügt: ${added.join(", ")}. `;
                    }
                    if (removed.length > 0) {
                      message += `Tags entfernt: ${removed.join(", ")}.`;
                    }
                    announcement.textContent = message;
                  }
                }

                onChange?.(newTags);
                e.currentTarget.innerHTML = renderTags(newTags);
              }}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                (e.preventDefault(), e.currentTarget.blur())
              }
              innerHTML={renderTags(value?.() || [])}
            />
          </div>

          {/* Hidden live region for announcements */}
          <div
            id={announcementId}
            class="sr-only"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          />
        </div>
      )}
    </InputWrapper>
  );
};

export default TagsInput;
