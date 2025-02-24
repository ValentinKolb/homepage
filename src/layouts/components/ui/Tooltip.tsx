import type { ParentProps, JSX } from "solid-js";

export interface TooltipProps extends ParentProps {
  /** The label to show as the tooltip. Can be a string or a component. */
  label: string | JSX.Element;
}

/**
 * Tooltip component
 *
 * Wraps its children in a container that shows a tooltip on hover.
 * The tooltip uses Tailwind CSS classes for styling. Does not use any JavaScript.
 */
export default function Tooltip(props: TooltipProps) {
  // If the label is a string, add classes for single-line display and a max width.
  const additionalClasses =
    typeof props.label === "string" ? "whitespace-nowrap max-w-xs" : "";

  return (
    <div class="group relative">
      {props.children}
      <div
        class={`absolute bottom-full left-1/2 z-[100] mb-2 hidden -translate-x-1/2 transform rounded bg-gray-800 px-2 py-1 text-xs text-white group-hover:block ${additionalClasses}`}
      >
        {props.label}
      </div>
    </div>
  );
}
