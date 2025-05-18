import type { ParentProps, JSX } from "solid-js";
import { createSignal, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { createFloating, autoUpdate, offset } from "floating-ui-solid";

export interface TooltipProps extends ParentProps {
  /** The label to show as the tooltip. Can be a string or a component. */
  label: string | JSX.Element;
}

/**
 * Tooltip component using Floating UI
 *
 * Wraps its children in a container that shows a tooltip on hover.
 * Uses SolidJS Portal to avoid overflow-hidden issues.
 * Uses Floating UI for positioning.
 */
export default function Tooltip(props: TooltipProps) {
  const [isOpen, setIsOpen] = createSignal(false);

  // Setup Floating UI
  const { refs, floatingStyles } = createFloating({
    placement: "top",
    whileElementsMounted: autoUpdate, // Update position on scroll/resize
    isOpen: isOpen,
    middleware: () => [offset(5)],
  });

  // Event handlers
  const handleMouseEnter = () => setIsOpen(true);
  const handleMouseLeave = () => setIsOpen(false);

  // Tooltip styles
  const tooltipBaseClass =
    "z-50 rounded-lg bg-gray-800 dark:bg-black dark:ring dark:ring-gray-500 dark:ring-inset px-3 p-2 text-xs text-white whitespace-normal break-words overflow-hidden";

  return (
    <>
      <div
        ref={refs.setReference}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        class="inline-flex"
      >
        {props.children}
      </div>

      <Show when={isOpen()}>
        <Portal>
          <div
            ref={refs.setFloating}
            style={{
              ...floatingStyles(),
              width: "max-content",
              "max-width": "min(calc(100vw - 24px), 500px)",
              "text-align": "left",
            }}
            class={tooltipBaseClass}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {props.label}
          </div>
        </Portal>
      </Show>
    </>
  );
}
