import type { ReciYML } from "@/components/solidjs/ReciYML/types";
import { createMemo, createSignal, For, Show } from "solid-js";

const RenderIngredients = (props: {
  ingredients: ReciYML["ingredients"];
  amountMultiplier: number;
}) => (
  <ul class="list-none divide-y divide-dotted divide-gray-200 p-0">
    <For each={props.ingredients}>
      {(ingredient) => (
        <li class="p-1 hover:bg-gray-50">
          <Show when={ingredient.amount}>
            <span class="me-2 rounded-lg bg-gray-50 p-1 text-sm">
              {ingredient.amount! * props.amountMultiplier}
              <Show when={ingredient.unit}> {ingredient.unit}</Show>
            </span>
          </Show>
          <span class="me-2 text-sm">{ingredient.name}</span>
          <Show when={ingredient.info}>
            <span class="text-sm text-gray-400 italic">{ingredient.info}</span>
          </Show>
        </li>
      )}
    </For>
  </ul>
);

const RenderInstructions = (props: {
  instructions: ReciYML["instructions"];
}) => (
  <ul class="list-disc pl-5">
    <For each={props.instructions}>
      {(instruction) => (
        <li class="mb-2">
          <Show when={instruction.value}>
            <span class="rounded-lg bg-gray-50 p-1 text-sm">
              {instruction.value}
              <Show when={instruction.unit}> {instruction.unit}</Show>
            </span>
          </Show>
          <Show when={instruction.info}>
            <span class="text-sm"> {instruction.info}</span>
          </Show>
        </li>
      )}
    </For>
  </ul>
);

const RenderStep = (props: {
  step: ReciYML;
  depth: number;
  amountMultiplier: number;
}) => {
  const [open, setOpen] = createSignal(props.depth === 0);

  const stepDetails = createMemo(() => [
    { key: "Info", value: props.step.info, icon: "ti-info-circle" },
    {
      key: "Menge",
      value: `${(props.step.amount || 0) * props.amountMultiplier || ""}${
        props.step.unit ? ` ${props.step.unit}` : ""
      }`,
      icon: "ti-baguette",
    },
    { key: "Arbeitszeit", value: props.step.duration, icon: "ti-clock" },
    { key: "Ruhezeit", value: props.step.waitTime, icon: "ti-clock" },
  ]);

  return (
    <details
      class={`relative rounded-lg border p-2 ${
        open() ? "mb-2 border-gray-200" : "border-transparent"
      }`}
      open={open()}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary class="flex cursor-pointer list-none flex-col">
        <div class="flex flex-row gap-2">
          <i class={`ti ${open() ? "ti-chevron-up" : "ti-chevron-down"}`} />
          <span
            class={`mb-2 font-bold ${props.depth === 0 ? "text-xl" : "text-lg"}`}
          >
            {props.step.name}
          </span>
        </div>

        <div class="flex flex-row flex-wrap gap-2">
          <For each={stepDetails().filter((obj) => !!obj.value)}>
            {(obj) => (
              <p class="flex flex-row items-center gap-1 rounded-lg bg-gray-50 p-2 text-sm text-gray-600">
                <i class={`ti ${obj.icon}`} /> {obj.key}: {obj.value}
              </p>
            )}
          </For>
        </div>
      </summary>

      <div class="mt-2">
        <div>
          <Show when={props.step.img}>
            <img
              src={props.step.img!}
              alt={`Schritt ${props.depth + 1}`}
              class="mb-2 h-auto w-full rounded-lg"
            />
          </Show>

          <div class="mb-2 flex flex-col gap-2 lg:flex-row">
            <Show when={props.step.ingredients}>
              <div class="flex-1">
                <span class="mb-2 font-semibold text-gray-800">Zutaten:</span>
                <RenderIngredients
                  ingredients={props.step.ingredients!}
                  amountMultiplier={props.amountMultiplier}
                />
              </div>
            </Show>
            <Show when={props.step.instructions}>
              <div class="flex-1">
                <span class="mb-2 font-semibold text-gray-800">Anleitung:</span>
                <RenderInstructions instructions={props.step.instructions!} />
              </div>
            </Show>
          </div>

          <Show when={props.step.steps && props.step.steps.length > 0}>
            <div class="ml-2">
              <For each={props.step.steps}>
                {(subStep) => (
                  <RenderStep
                    step={subStep}
                    depth={props.depth + 1}
                    amountMultiplier={props.amountMultiplier}
                  />
                )}
              </For>
            </div>
          </Show>
        </div>
      </div>
    </details>
  );
};

export default RenderStep;
