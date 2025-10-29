import { parseImage, showFileDialog } from "@/lib/client/files";
import { Show } from "solid-js";
import { InputWrapper } from "./util";

/**
 * Image input component with file upload and preview
 * @param label - Optional label text
 * @param description - Optional description text
 * @param ariaLabel - Accessibility label (defaults to label if not provided)
 * @param value - Reactive string value getter (base64 or URL)
 * @param onChange - Called when image changes (receives base64 string or null)
 * @param error - Reactive error message getter
 * @param round - Display image in circular shape
 * @param required - Show required asterisk after label
 */
const ImageInput = ({
  label,
  description,
  ariaLabel,
  value,
  onChange,
  error,
  round,
  required = false,
}: {
  label?: string;
  description?: string;
  ariaLabel?: string;
  value?: () => string | null;
  round?: boolean;
  onChange?: (value: string | null) => void;
  error?: () => string | undefined;
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
        <div
          class="flex flex-col items-center gap-1"
          role="group"
          aria-labelledby={inputId}
          aria-describedby={ariaDescribedBy}
        >
          <div
            class={`h-30 w-30 self-center overflow-hidden ${round ? "rounded-full" : "rounded-lg"} border-2 border-gray-200 md:h-50 md:w-50 dark:border-gray-700`}
          >
            <Show
              when={value?.()}
              fallback={
                <div class="flex h-full w-full items-center justify-center">
                  <i class="ti ti-photo-off text-2xl text-gray-400 dark:text-gray-700" />
                </div>
              }
            >
              <img
                src={value!() as string}
                alt={label || "Ausgewähltes Bild"}
                class="h-full w-full object-cover"
                aria-label={ariaLabel || label || "Selected Image"}
              />
            </Show>
          </div>

          <div class="mb-4 flex flex-row items-center gap-2 self-center">
            <Show when={value?.()}>
              <button
                type="button"
                class="btn btn-subtle group dark:hover:text-red-500"
                onClick={() => {
                  onChange?.(null);
                }}
                aria-label="Bild entfernen"
              >
                <i class="ti ti-trash group-hover:hidden" aria-hidden="true" />
                <i
                  class="ti ti-trash-x hidden group-hover:block"
                  aria-hidden="true"
                />
                Entfernen
              </button>
            </Show>

            <button
              type="button"
              class="btn btn-subtle group dark:hover:text-blue-500"
              onClick={() => {
                showFileDialog(".jpg,.jpeg,.png,.gif,.webp")
                  .then((file) => parseImage(file))
                  .then((image) => onChange?.(image));
              }}
              aria-label={value?.() ? "Bild ändern" : "Bild hinzufügen"}
            >
              <i
                class="ti ti-photo-plus group-hover:hidden"
                aria-hidden="true"
              />
              <i
                class="ti ti-cloud-upload hidden group-hover:block"
                aria-hidden="true"
              />
              {value?.() ? "Ändern" : "Hinzufügen"}
            </button>
          </div>
        </div>
      )}
    </InputWrapper>
  );
};

export default ImageInput;
