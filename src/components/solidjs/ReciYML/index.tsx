import type { ReciYML as ReciYMLType } from "./types";
import { createMemo, createSignal, Show } from "solid-js";
import { Tab, Tabs } from "@/components/solidjs/Tabs";
import RenderShoppingList from "./RenderShoppingList";
import RenderStep from "./RenderStep";

export default function ReciYML({ recipe }: { recipe: ReciYMLType }) {
  const [amount, setAmount] = createSignal(recipe.amount || 1);
  const amountMultiplier = createMemo(() => amount() / (recipe.amount || 1));

  return (
    <div>
      {/* Mengeneingabe */}
      <div
        class="mb-2 rounded-lg border border-gray-200 bg-white px-3 py-2"
        data-hs-input-number=""
      >
        <div class="flex w-full items-center justify-between gap-x-5">
          <div class="grow">
            <span class="block text-xs text-gray-500">
              Menge
              <Show when={recipe.unit}> ({recipe.unit}) </Show>
            </span>
            <input
              class="w-full appearance-none border-0 bg-transparent p-0 text-gray-800 ring-0 outline-0"
              type="number"
              inputMode="numeric"
              aria-roledescription="Number field"
              value={amount()}
              min={1}
              onInput={(e) =>
                setAmount(Math.max(1, Number(e.currentTarget.value)))
              }
              data-hs-input-number-input=""
            />
          </div>
          <div class="flex items-center justify-end gap-x-1.5">
            <button
              type="button"
              class="inline-flex size-6 items-center justify-center gap-x-2 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-800 shadow-xs hover:bg-gray-50 focus:bg-gray-50 focus:outline-hidden active:border-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Decrease"
              onClick={() => setAmount(Math.max(1, amount() - 1))}
              data-hs-input-number-decrement=""
              disabled={amount() <= 1}
            >
              <i class="ti ti-minus text-gray-400"></i>
            </button>
            <button
              type="button"
              class="inline-flex size-6 items-center justify-center gap-x-2 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-800 shadow-xs hover:bg-gray-50 focus:bg-gray-50 focus:outline-hidden active:border-gray-300 disabled:opacity-50"
              aria-label="Increase"
              onClick={() => setAmount(amount() + 1)}
              data-hs-input-number-increment=""
            >
              <i class="ti ti-plus text-gray-400"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs>
        <Tab title="Rezept">
          <RenderStep
            step={recipe}
            depth={0}
            amountMultiplier={amountMultiplier()}
          />
        </Tab>

        <Tab title="Einkaufsliste">
          <RenderShoppingList
            recipe={recipe}
            amountMultiplier={amountMultiplier()}
          />
        </Tab>
      </Tabs>
    </div>
  );
}
