import { z } from "zod";

const ingredientSchema = z.object({
  name: z.string(),
  amount: z.number().optional(),
  unit: z.string().optional(),
  temperature: z.number().optional(),
  info: z.string().optional(),
  hideFromShoppingList: z.boolean().optional(),
  meta: z.any().optional(),
});

const baseReciymlSchema = z.object({
  name: z.string(),
  info: z.string().optional(),
  img: z.string().optional(),
  amount: z.number().optional(),
  unit: z.string().optional(),
  duration: z.string().optional(),
  waitTime: z.string().optional(),
  instructions: z
    .array(
      z.object({
        info: z.string().optional(),
        value: z.union([z.string(), z.number()]).optional(),
        unit: z.string().optional(),
        meta: z.any().optional(),
      }),
    )
    .optional(),
  additionalIngredients: z.array(ingredientSchema).optional(),
  ingredients: z.array(ingredientSchema).optional(),
  meta: z.any().optional(),
});

export const ReciYMLSchema: z.ZodType<ReciYML> = z.lazy(() =>
  baseReciymlSchema.extend({
    steps: z.array(ReciYMLSchema).optional(), // Rekursion
  }),
);

export type Ingredient = z.infer<typeof ingredientSchema>;

export type ReciYML = z.infer<typeof baseReciymlSchema> & {
  steps?: ReciYML[];
};
