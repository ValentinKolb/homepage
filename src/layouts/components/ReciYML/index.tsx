import { type ReciYML } from "@/components/ReciYML/types";
import { IconMinus, IconPlus } from "@tabler/icons-react";
import React, { useState } from "react";
import RenderStep from "./RenderStep";
import RenderShoppingList from "./RenderShoppingList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ReciYML({ recipe }: { recipe: ReciYML }) {
  const [amount, setAmount] = useState(recipe.amount || 1);

  const amountMultiplier = amount / (recipe.amount || 1);

  return (
    <div className="">
      <div
        className="py-2 px-3 bg-white border border-gray-200 rounded-lg mb-2 "
        data-hs-input-number=""
      >
        <div className="w-full flex justify-between items-center gap-x-5">
          <div className="grow">
            <span className="block text-xs text-gray-500">
              Menge {recipe.unit ? `(${recipe.unit})` : ""}
            </span>
            <input
              className="w-full p-0 bg-transparent border-0 text-gray-800 focus:ring-0"
              type="number"
              inputMode="numeric"
              aria-roledescription="Number field"
              value={amount}
              min={1}
              onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
              data-hs-input-number-input=""
            />
          </div>
          <div className="flex justify-end items-center gap-x-1.5">
            <button
              type="button"
              className="size-6 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-full border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 active:border-gray-300 focus:outline-none focus:bg-gray-50 disabled:opacity-50  disabled:cursor-not-allowed"
              aria-label="Decrease"
              onClick={() => setAmount(Math.max(1, amount - 1))}
              data-hs-input-number-decrement=""
              disabled={amount <= 1}
            >
              <IconMinus className="text-gray-400" size={"1rem"} />
            </button>
            <button
              type="button"
              className="size-6 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-full border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 active:border-gray-300 focus:outline-none focus:bg-gray-50 disabled:opacity-50"
              aria-label="Increase"
              onClick={() => setAmount(amount + 1)}
              data-hs-input-number-increment=""
            >
              <IconPlus className="text-gray-400" size={"1rem"} />
            </button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="recipe">
        <TabsList className="w-full">
          <TabsTrigger className="w-full" value="recipe">
            Rezept
          </TabsTrigger>
          <TabsTrigger className="w-full" value="shopping-list">
            Einkaufsliste
          </TabsTrigger>
        </TabsList>
        <TabsContent value="recipe">
          <RenderStep
            step={recipe}
            depth={0}
            amountMultiplier={amountMultiplier}
          />
        </TabsContent>
        <TabsContent value="shopping-list">
          <RenderShoppingList
            recipe={recipe}
            amountMultiplier={amountMultiplier}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
