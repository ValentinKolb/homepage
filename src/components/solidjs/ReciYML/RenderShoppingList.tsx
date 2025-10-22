import convert, { type Unit } from "convert";
import { createMemo, For, Show } from "solid-js";
import type { Ingredient, ReciYML } from "./types";

const UNIT_CONVERSIONS: Record<string, { base: string; factor: number }> = {
  mg: { base: "g", factor: 0.001 },
  g: { base: "g", factor: 1 },
  kg: { base: "g", factor: 1000 },
  t: { base: "g", factor: 1_000_000 },
  ml: { base: "ml", factor: 1 },
  l: { base: "ml", factor: 1000 },
};

/**
 * Converts an amount to a base unit
 */
const convertToBaseUnit = (amount: number, unit?: string) => {
  if (!unit) return { amount, unit };

  const normalizedUnit = unit.toLowerCase();
  if (UNIT_CONVERSIONS[normalizedUnit]) {
    return {
      amount: amount * UNIT_CONVERSIONS[normalizedUnit].factor,
      unit: UNIT_CONVERSIONS[normalizedUnit].base,
    };
  }

  return { amount, unit };
};

/**
 * Formats an amount and unit to the most suitable unit
 */
const formatAmount = (a: number, u?: string) => {
  const round = (val: number) => Math.round(val * 100) / 100;
  if (!u) return { amount: round(a), unit: u };

  const { quantity: amount, unit } = convert(a, u as Unit).to("best");
  return { amount: round(amount), unit: unit.toLowerCase() };
};

/**
 * Groups ingredients by name and unit
 */
const normalizeIngredients = (ingredients: Ingredient[]) => {
  const ingredientMap = new Map<string, Ingredient>();

  ingredients.forEach((ingredient) => {
    const { amount: normalizedAmount, unit: baseUnit } = convertToBaseUnit(
      ingredient.amount || 0,
      ingredient.unit,
    );
    const key = `${ingredient.name.toLowerCase()}_${baseUnit}`;

    if (ingredientMap.has(key)) {
      ingredientMap.set(key, {
        ...ingredient,
        amount: (ingredientMap.get(key)!.amount || 0) + normalizedAmount,
      });
    } else {
      ingredientMap.set(key, {
        ...ingredient,
        amount: normalizedAmount,
        unit: baseUnit,
      });
    }
  });

  return [...ingredientMap.values()];
};

/**
 * Collects all ingredients from a recipe and its substeps
 */
const collectIngredients = (recipe: ReciYML, amountMultiplier: number) => {
  let ingredients: Ingredient[] = [];

  const addIngredient = (ingredient: Ingredient) => {
    ingredients.push({
      ...ingredient,
      amount: ingredient.amount ? ingredient.amount * amountMultiplier : 0,
    });
  };

  recipe.ingredients?.forEach(addIngredient);
  recipe.additionalIngredients?.forEach(addIngredient);

  recipe.steps?.forEach((step) => {
    ingredients = [
      ...ingredients,
      ...collectIngredients(step, amountMultiplier),
    ];
  });

  return ingredients;
};

/**
 * SolidJS Component: Renders a shopping list from a recipe
 */
const RenderShoppingList = (props: {
  recipe: ReciYML;
  amountMultiplier: number;
}) => {
  const ingredientList = createMemo(() =>
    normalizeIngredients(
      collectIngredients(props.recipe, props.amountMultiplier),
    )
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter((ingredient) => !ingredient.hideFromShoppingList),
  );

  const renderAmount = (amount: number, unit?: string) => {
    const { amount: formattedAmount, unit: formattedUnit } = formatAmount(
      amount,
      unit,
    );
    return `${formattedAmount}${formattedUnit ? ` ${formattedUnit}` : ""}`;
  };

  return (
    <div class="overflow-hidden rounded-lg border">
      <ul class="m-0 list-none divide-y divide-dotted divide-gray-200 overflow-hidden p-0">
        <For each={ingredientList()}>
          {(ingredient) => (
            <li class="m-0 flex justify-between p-1 px-2 hover:bg-gray-50">
              <span class="text-gray-800">{ingredient.name}</span>
              <Show when={ingredient.amount}>
                <span class="text-gray-600">
                  {renderAmount(ingredient.amount!, ingredient.unit)}
                </span>
              </Show>
            </li>
          )}
        </For>
      </ul>
    </div>
  );
};

export default RenderShoppingList;
