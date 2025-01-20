import { type ReciYML, type Ingredient } from "./types";
import React, { useMemo } from "react";
import convert, { type Unit } from "convert";

const UNIT_CONVERSIONS: Record<string, { base: string; factor: number }> = {
  mg: { base: "g", factor: 0.001 },
  g: { base: "g", factor: 1 },
  kg: { base: "g", factor: 1000 },
  t: { base: "g", factor: 1_000_000 },

  ml: { base: "ml", factor: 1 },
  l: { base: "ml", factor: 1000 },
};

/**
 * converts an amount to a base unit
 * if the unit is not known, the unit is returned unchanged
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
 * formats a amount and unit to the most suitable unit
 * e.g. 0.001 kg -> 1 g
 */
const formatAmount = (a: number, u?: string) => {
  const round = (val: number) => Math.round(val * 100) / 100;

  if (!u) return { amount: round(a), unit: u };
  const { quantity: amount, unit: unit } = convert(a, u as Unit).to("best");
  return { amount: round(amount), unit: unit.toLowerCase() };
};

/**
 * this function groups the ingredients by name and unit
 */
const normalizeIngredients = (ingredients: Ingredient[]) => {
  const ingredientMap = new Map<string, Ingredient>();

  ingredients?.forEach((ingredient) => {
    const { amount: normalizedAmount, unit: baseUnit } = convertToBaseUnit(
      ingredient.amount || 0,
      ingredient.unit,
    );
    const key = `${ingredient.name.toLowerCase()}_${baseUnit}`; // key that groups by name and unit

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

  return [...ingredientMap.entries()].map(([_, value]) => value);
};

/**
 * this function collects all ingredients from a recipe and its substeps
 * @param recipe the recipe to collect the ingredients from
 * @param amountMultiplier the multiplier for the amount of the ingredients
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

const RenderShoppingList = ({
  recipe,
  amountMultiplier,
}: {
  recipe: ReciYML;
  amountMultiplier: number;
}) => {
  const ingredientList = useMemo(() => {
    return normalizeIngredients(collectIngredients(recipe, amountMultiplier))
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter((ingredient) => ingredient.hideFromShoppingList !== true);
  }, [recipe, amountMultiplier]);

  const renderAmount = (amount: number, unit?: string) => {
    const { amount: formattedAmount, unit: formattedUnit } = formatAmount(
      amount,
      unit,
    );

    return `${formattedAmount}${formattedUnit ? ` ${formattedUnit}` : ""}`;
  };

  return (
    <div className="rounded-lg border">
      <ul className="list-none divide-y divide-dotted divide-gray-200 overflow-hidden">
        {ingredientList.map((ingredient, index) => (
          <li
            key={index}
            className="px-2 p-1 flex justify-between hover:bg-gray-50"
          >
            <span className="text-gray-800">{ingredient.name}</span>

            {!!ingredient.amount && (
              <span className="text-gray-600">
                {renderAmount(ingredient.amount, ingredient.unit)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RenderShoppingList;
