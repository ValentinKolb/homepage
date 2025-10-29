import { parseImage, showFileDialog } from "@/lib/client/files";
import { prompts } from "@/lib/client/prompt-lib";
import { createMutation } from "@/lib/solidjs/mutation";
import { actions } from "astro:actions";
import { createStore } from "solid-js/store";
import { euro } from "./util";
import { navigate } from "astro:transitions/client";
import TextInput from "@/components/solidjs/input/text";
import TagsInput from "@/components/solidjs/input/tags";
import type { ShopItem } from "@/actions/shop/types";

// Helper function to create a deep copy of ShopItem
const deepCopyItem = (item: ShopItem): ShopItem => {
  return {
    ...item,
    tags: [...(item.tags || [])],
  };
};

const InventoryItemView = (initial: { item: ShopItem }) => {
  let dialogRef: HTMLDialogElement | undefined;
  const [item, setItem] = createStore(initial.item);
  const [updatedItem, setUpdatedItem] = createStore(deepCopyItem(initial.item));

  const updateItemMutation = createMutation({
    mutation: async () =>
      actions.shop.items.update.orThrow({
        itemId: initial.item.id,
        name: updatedItem.name,
        description: updatedItem.description,
        ean13: updatedItem.ean13,
        priceCents: updatedItem.priceCents,
        tags: updatedItem.tags,
        imgData:
          updatedItem.imgSrc !== item.imgSrc ? updatedItem.imgSrc : undefined,
      }),
    onSuccess: () => {
      dialogRef?.close();
      setItem(deepCopyItem(updatedItem));
    },
  });

  const updateStockMutation = createMutation({
    mutation: async () => {
      const updates = await prompts.form({
        title: "Auffüllen",
        icon: "ti ti-plus",
        fields: {
          quantity: {
            type: "number",
            label: "Anzahl",
            required: true,
            description: "Wie viele Produkte fügst du zum Kiosk hinzu?",
            min: 1,
            default: 1,
          },
          creditUser: {
            type: "boolean",
            label: "Warenwert zu deinem Guthaben hinzufügen?",
          },
        },
      });

      if (!updates) return;
      const data = await actions.shop.transactions.restock.orThrow({
        itemId: item.id,
        quantity: updates.quantity,
        creditUser: updates.creditUser,
      });

      setItem("stock", data.newStock);
    },
    onError: () => prompts.error("Bestand konnte nicht aktualisiert werden"),
  });

  const archiveItemMutation = createMutation({
    mutation: async () => {
      const confirm = await prompts.confirm(
        "Soll der Artikel wirklich gelöscht werden?",
      );
      if (!confirm) return;
      await actions.shop.items.update.orThrow({
        itemId: item.id,
        active: false,
      });
      return navigate(window.location.href, { history: "replace" });
    },
    onError: () => {
      prompts.error("Löschen fehlgeschlagen. Bitte versuche es erneut.");
    },
  });

  const lossMutation = createMutation({
    mutation: async () => {
      const quantity = await prompts.promptNumber(
        "Bitte gib die Anzahl der Artikel ein, die aus dem Kiosk entfernt werden sollen.",
        0,
        {
          title: "Artikelverlust",
          icon: "ti ti-egg-cracked",
          min: 0,
          max: item.stock,
        },
      );

      if (!quantity) return;

      const { newStock } = await actions.shop.transactions.loss.orThrow({
        itemId: item.id,
        quantity,
      });
      setItem("stock", newStock);
    },
    onError: () => {
      prompts.error(
        "Verlust eintragen fehlgeschlagen. Bitte versuche es erneut.",
      );
    },
  });

  return (
    <>
      <div class="grid grid-cols-[100px_1fr] grid-rows-[auto_auto_auto] gap-x-3 gap-y-2">
        {/* Image - spans 2 rows */}
        <div class="row-span-2 h-24 w-24 overflow-hidden rounded-lg">
          {item.imgSrc ? (
            <img
              src={item.imgSrc}
              alt={item.name}
              class="h-full w-full object-cover"
            />
          ) : (
            <div class="flex h-full w-full items-center justify-center bg-gray-50 dark:bg-gray-900">
              <i class="ti ti-bottle text-2xl text-gray-400 dark:text-gray-600" />
            </div>
          )}
        </div>

        {/* Article name */}
        <div class="self-center truncate text-lg font-semibold">
          {item.name}
        </div>
        {/* Price and Stock grouped together */}
        <div class="flex flex-col">
          <div class="text-sm">{euro(item.priceCents)}</div>
          <div class="text-sm">
            <span>Bestand:</span>
            <span
              class={`ml-1 ${item.stock > 5 ? "text-green-600" : item.stock > 0 ? "text-orange-600" : "font-semibold text-red-600"}`}
            >
              {item.stock}
              {item.stock > 0 ? " Stück" : " (leer)"}
            </span>
          </div>
        </div>

        {item.description ? (
          <p class="text-dimmed col-span-2 truncate overflow-hidden rounded py-2 text-xs">
            {item.description ? item.description : "Keine Beschreibung"}
          </p>
        ) : (
          <div class="text-dimmed col-span-2 flex items-center gap-1 overflow-hidden py-2 text-xs">
            <i class="ti ti-question-mark" />
            Keine Beschreibung
          </div>
        )}

        {/* Action buttons - spans 2 columns */}
        <div class="col-span-2 flex gap-2">
          <button
            class="btn-subtle group flex-nowrap px-3 py-2 hover:text-red-500"
            onClick={lossMutation.mutate}
            aria-label="Create item loss"
          >
            <i class={`ti ti-table-minus group-hover:hidden`}></i>
            <i class="ti ti-egg-cracked hidden group-hover:block"></i>
          </button>
          <button
            class={`btn-subtle group flex-nowrap px-3 py-2 hover:text-blue-500`}
            onClick={() => dialogRef?.showModal()}
          >
            <i class={`ti ti-pencil group-hover:hidden`}></i>
            <i class="ti ti-bottle hidden group-hover:block"></i>
          </button>

          <button
            class="btn-subtle group flex-1 flex-nowrap justify-center px-3 py-2 hover:text-green-500"
            onClick={updateStockMutation.mutate}
          >
            <i class={`ti ti-plus group-hover:hidden`} />
            <i class="ti ti-basket-plus hidden group-hover:block" />
            <span class="hidden sm:block">Auffüllen</span>
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      <dialog
        ref={dialogRef}
        class="paper fixed top-1/2 left-1/2 z-50 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 p-4 backdrop:bg-black/50 backdrop:backdrop-blur-sm dark:bg-gray-900"
      >
        <div class="flex flex-col gap-2">
          <h2 class="mb-4 flex items-center gap-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Bearbeiten
          </h2>

          <div class="h-30 w-30 self-center overflow-hidden rounded-lg border-2 border-gray-200 md:h-50 md:w-50 dark:border-gray-700">
            {updatedItem.imgSrc ? (
              <img
                id="item-image"
                src={updatedItem.imgSrc}
                alt="Acrticle Image"
                class="h-full w-full object-cover"
              />
            ) : (
              <div class="flex h-full w-full items-center justify-center">
                <i class="ti ti-photo-off text-2xl text-gray-400 dark:text-gray-700" />
              </div>
            )}
          </div>

          <div class="mb-4 flex flex-row items-center gap-2 self-center">
            {updatedItem.imgSrc && (
              <button
                class="btn btn-danger dark:btn-subtle group dark:hover:text-red-500"
                onClick={() => {
                  setUpdatedItem("imgSrc", null);
                }}
              >
                <i class="ti ti-trash group-hover:hidden" />
                <i class="ti ti-trash-x hidden group-hover:block" />
                Entfernen
              </button>
            )}

            <button
              class="btn btn-primary dark:btn-subtle group dark:hover:text-blue-500"
              onClick={() => {
                showFileDialog(".jpg,.jpeg,.png,.gif,.webp")
                  .then((file) => parseImage(file))
                  .then((image) => setUpdatedItem("imgSrc", image));
              }}
            >
              <i class="ti ti-photo-plus group-hover:hidden" />
              <i class="ti ti-cloud-upload hidden group-hover:block" />
              Bild {updatedItem.imgSrc ? "ändern" : "hinzufügen"}
            </button>
          </div>

          {updateItemMutation.error() && (
            <div class="rounded p-2 text-xs text-red-500 ring-1 ring-red-500">
              Das Speichern ist fehlgeschlagen. Bitte versuche es erneut.
            </div>
          )}

          <TextInput
            placeholder="Bezeichnung"
            value={() => updatedItem.name}
            icon="ti ti-bottle"
            onInput={(value) => setUpdatedItem("name", value)}
          />

          <TextInput
            placeholder="Preis pro Stück"
            value={() =>
              (updatedItem.priceCents / 100).toFixed(2).replace(".", ",")
            }
            icon="ti ti-currency-euro"
            activeIcon="ti ti-coin-euro"
            onChange={(value) => {
              const euros = parseFloat(
                value.replace(/\./g, "").replace(",", "."),
              );
              if (!isNaN(euros)) {
                setUpdatedItem("priceCents", Math.round(euros * 100));
              }
            }}
          />

          <TextInput
            placeholder="EN13 Barcode (optional)"
            value={() => updatedItem.ean13 ?? ""}
            icon="ti ti-barcode"
            onInput={(value) => setUpdatedItem("ean13", value || null)}
          />

          <TagsInput
            placeholder="Tags (z.b. Getränk, Koffein, ...)"
            value={() => updatedItem.tags}
            onChange={(tags) => setUpdatedItem("tags", tags)}
          />

          <TextInput
            placeholder="Beschreibung (optional)"
            value={() => updatedItem.description ?? ""}
            onInput={(value) => setUpdatedItem("description", value || null)}
            multiline
          />

          <div class="flex flex-row justify-end gap-2">
            <button
              class="btn-danger group mr-auto px-3 py-2"
              onClick={archiveItemMutation.mutate}
            >
              <i class="ti ti-trash group-hover:hidden"></i>
              <i class="ti ti-trash-x hidden group-hover:block"></i>
              Löschen
            </button>

            <button
              class="btn-subtle px-3 py-2"
              onClick={() => {
                setUpdatedItem(deepCopyItem(item)); // revert to original item
                dialogRef?.close();
              }}
            >
              Abbrechen
            </button>
            <button
              class={`btn-success px-3 py-2 ${updatedItem.name === "" ? "cursor-not-allowed opacity-30" : ""}`}
              disabled={updatedItem.name === "" || updateItemMutation.loading()}
              onClick={updateItemMutation.mutate}
            >
              Speichern
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
};

export default InventoryItemView;
