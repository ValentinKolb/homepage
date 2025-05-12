import Tooltip from "@/components/core/Tooltip";
import { createSignal, For } from "solid-js";

const ACCEPTED_FILE_TYPES = ".png,.jpg,.jpeg";

/**
 * Converts an image to a base64 string
 * @param imageFile - The image file to convert
 * @returns Promise containing the base64 string
 */
function imageToBase64(imageFile: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        // reader.result contains the base64 data with a prefix like "data:image/jpeg;base64,"
        // we can either:
        // 1. Return the full data URL: resolve(reader.result);
        // 2. Or extract just the base64 part:
        const base64String = reader.result.split(",")[1];
        resolve(base64String);
      } else {
        reject(new Error("Failed to convert image to base64"));
      }
    };

    reader.onerror = () => {
      reject(new Error(`Error reading file ${imageFile.name}`));
    };

    reader.readAsDataURL(imageFile);
  });
}

const [images, setImages] = createSignal<Base64Image[]>([]);

export type Base64Image = {
  name: string;
  base64: string;
};

/**
 * This hook provides a Button to select images and convert them to base64.
 * It also returns an array of Base64Image objects as well as Component to display the selected images (remove them).
 */
export default function useBase64ImageSelect() {
  let fileInputRef: HTMLInputElement | undefined;

  const AddImageBtn = () => (
    <Tooltip label={"Bilder hinzufügen"}>
      <input
        type="file"
        multiple
        ref={fileInputRef}
        class="hidden"
        accept={ACCEPTED_FILE_TYPES}
        onChange={(e) => {
          if (!e.target.files) return;
          Array.from(e.target.files)
            .filter(
              (file) =>
                !images()
                  .map((image) => image.name)
                  .includes(file.name),
            )
            .forEach(async (file) => {
              const base64 = await imageToBase64(file);
              setImages((prev) => [
                ...prev,
                {
                  name: file.name,
                  base64,
                },
              ]);
            });
        }}
      />

      <button
        class="icon-btn"
        onClick={() => fileInputRef?.click()}
        aria-label="Bilder hinzufügen"
      >
        <i class={`ti ti-photo`} />
      </button>
    </Tooltip>
  );

  const SelectedImages = () => (
    <div class="flex flex-row flex-wrap gap-3 text-xs text-gray-400">
      <For each={images()}>
        {(image) => (
          <div class="flex items-center justify-center gap-1">
            <button
              onClick={() => {
                console.log("Removing image:", image.name);
                setImages((prev) => prev.filter((i) => i.name !== image.name));
              }}
              aria-label={`Entferne ${image.name}`}
              class="peer hover:text-red-500"
            >
              <i class={`ti ti-trash`} />
            </button>
            <span class="peer-hover:line-through">{image.name}</span>
          </div>
        )}
      </For>
    </div>
  );

  return {
    AddImageBtn,
    SelectedImages,
    images,
    clear: () => setImages([]),
  };
}
