import { type ReciYML } from "@/components/ReciYML/types";
import {
  IconBaguette,
  IconChevronDown,
  IconChevronUp,
  IconClock,
  IconInfoCircle,
} from "@tabler/icons-react";
import React, { useState } from "react";

const RenderIngredients = ({
  ingredients,
  amountMultiplier,
}: {
  ingredients: ReciYML["ingredients"];
  amountMultiplier: number;
}) => {
  return (
    <ul className="list-none divide-y divide-dotted divide-gray-200">
      {ingredients?.map((ingredient, index) => (
        <li key={index} className="p-1 hover:bg-gray-50">
          {ingredient.amount && (
            <>
              <span className="text-sm rounded-lg bg-gray-50 p-1 me-2">
                {ingredient.amount * amountMultiplier}
                {ingredient.unit && <> {ingredient.unit}</>}
              </span>
            </>
          )}
          <span className="text-sm me-2">{ingredient.name}</span>
          {ingredient.info && (
            <span className="text-sm text-gray-400 italic">
              {ingredient.info}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
};

const RenderInstructions = ({
  instructions,
}: {
  instructions: ReciYML["instructions"];
}) => {
  return (
    <ul className="list-disc pl-5">
      {instructions?.map((instruction, index) => (
        <li key={index} className="mb-2">
          {instruction.value && (
            <>
              <span className="text-sm rounded-lg bg-gray-50 p-1">
                {instruction.value}
                {instruction.unit && <> {instruction.unit}</>}
              </span>
            </>
          )}

          {instruction.info && (
            <span className="text-sm"> {instruction.info}</span>
          )}
        </li>
      ))}
    </ul>
  );
};

const RenderStep = ({
  step,
  depth,
  amountMultiplier,
}: {
  step: ReciYML;
  depth: number;
  amountMultiplier: number;
}) => {
  const [open, setOpen] = useState(depth === 0);

  return (
    <>
      <details
        className={`relative rounded-lg border p-2 ${open ? "border-gray-200 mb-2" : "border-transparent"}`}
        open={open}
        onToggle={(e) => setOpen(e.currentTarget.open)}
      >
        <summary className="cursor-pointer list-none flex flex-col">
          <div className="flex flex-row gap-2">
            {open ? <IconChevronUp /> : <IconChevronDown />}
            <h3
              className={`font-bold mb-2 ${depth === 0 ? "text-xl" : "text-lg"}`}
            >
              {step.name}
            </h3>
          </div>

          <div className="flex flex-row flex-wrap gap-2">
            {[
              {
                key: "Info",
                value: step.info,
                icon: <IconInfoCircle size={"1rem"} />,
              },
              {
                key: "Menge",
                value: `${(step.amount || 0) * amountMultiplier || ""}${step.unit ? ` ${step.unit}` : ""}`,
                icon: <IconBaguette size={"1rem"} />,
              },
              {
                key: "Arbeitszeit",
                value: step.duration,
                icon: <IconClock size={"1rem"} />,
              },
              {
                key: "Ruhezeit",
                value: step.waitTime,
                icon: <IconClock size={"1rem"} />,
              },
            ]
              .filter((obj) => !!obj.value)
              .map((obj, i) => (
                <p
                  key={i}
                  className="text-sm text-gray-600 rounded-lg bg-gray-50 p-2 flex flex-row gap-1 items-center"
                >
                  {obj.icon} {obj.key}: {obj.value}
                </p>
              ))}
          </div>
        </summary>

        <div className="mt-2">
          <div key={depth} className="">
            {step.img && (
              <img
                src={step.img}
                alt={`Schritt ${depth + 1}`}
                className="w-full h-auto mb-2 rounded-lg"
              />
            )}

            <div className="flex flex-col lg:flex-row gap-2 mb-2">
              {step.ingredients && (
                <div className="flex-1">
                  <span className="font-semibold text-gray-800 mb-2">
                    Zutaten:
                  </span>
                  <RenderIngredients
                    ingredients={step.ingredients}
                    amountMultiplier={amountMultiplier}
                  />
                </div>
              )}
              {step.instructions && (
                <div className="flex-1">
                  <span className="font-semibold text-gray-800 mb-2">
                    Anleitung:
                  </span>
                  <RenderInstructions instructions={step.instructions} />
                </div>
              )}
            </div>

            {step.steps && step.steps.length > 0 && (
              <div className="ml-2">
                {step.steps.map((subStep, idx) => (
                  <RenderStep
                    key={idx}
                    step={subStep}
                    depth={depth + 1}
                    amountMultiplier={amountMultiplier}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </details>
    </>
  );
};

export default RenderStep;
