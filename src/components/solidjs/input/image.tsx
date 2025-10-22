import { parseImage, showFileDialog } from "@/lib/client/files";
import { Show } from "solid-js";

const ImageInput = ({
  ariaLabel,
  value,
  onChange,
  error,
  round,
}: {
  ariaLabel: string;
  value?: () => string | null;
  round?: boolean;
  onChange?: (value: string | null) => void;
  error?: () => string | undefined;
}) => {
  return (
    <div class="flex flex-col items-center gap-1" aria-label={ariaLabel}>
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
            id="item-image"
            src={value!() as string}
            alt="Acrticle Image"
            class="h-full w-full object-cover"
          />
        </Show>
      </div>

      <div class="mb-4 flex flex-row items-center gap-2 self-center">
        <Show when={value?.()}>
          <button
            class="btn btn-subtle group dark:hover:text-red-500"
            onClick={() => {
              onChange?.(null);
            }}
          >
            <i class="ti ti-trash group-hover:hidden" />
            <i class="ti ti-trash-x hidden group-hover:block" />
            Entfernen
          </button>
        </Show>

        <button
          class="btn btn-subtle group dark:hover:text-blue-500"
          onClick={() => {
            showFileDialog(".jpg,.jpeg,.png,.gif,.webp")
              .then((file) => parseImage(file))
              .then((image) => onChange?.(image));
          }}
        >
          <i class="ti ti-photo-plus group-hover:hidden" />
          <i class="ti ti-cloud-upload hidden group-hover:block" />
          {value?.() ? "Ändern" : "Hinzufügen"}
        </button>
      </div>

      {error?.() && <p class="text-sm text-red-500">{error()}</p>}
    </div>
  );
};

export default ImageInput;
