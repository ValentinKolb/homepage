import type { ParentProps, JSX } from "solid-js";
import { createSignal, Show } from "solid-js";
import { Portal } from "solid-js/web";

export type TooltipProps = ParentProps & {
  label: string | JSX.Element;
  class?: string;
  offset?: number;
};

/**
 * Minimal tooltip component - always positioned above trigger
 *
 * @param props - Tooltip properties
 * @param props.label - Content to display in tooltip
 * @param props.offset - Distance from trigger element (default: 8)
 * @param props.class - Additional CSS classes for trigger wrapper
 * @returns Tooltip component with automatic viewport bounds
 */
export default function Tooltip(props: TooltipProps) {
  const [isOpen, setIsOpen] = createSignal(false);
  const [triggerRect, setTriggerRect] = createSignal<DOMRect | null>(null);

  let triggerRef: HTMLDivElement | undefined;

  const handleMouseEnter = () => {
    if (triggerRef) {
      setTriggerRect(triggerRef.getBoundingClientRect());
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  const tooltipStyles = () => {
    const rect = triggerRect();
    if (!rect) return {};

    const offset = props.offset || 8;
    const tooltipWidth = 200;
    const padding = 8; // Viewport padding

    // Center position above trigger
    const centerX = rect.left + rect.width / 2;
    const left = centerX - tooltipWidth / 2;

    return {
      position: "fixed",
      width: `${tooltipWidth}px`,
      left: `max(${padding}px, min(${left}px, calc(100vw - ${tooltipWidth + padding}px)))`,
      top: `${rect.top - offset}px`,
      transform: "translateY(-100%)",
    } as JSX.CSSProperties;
  };

  const tooltipClass =
    "z-50 rounded-lg bg-gray-800 dark:bg-black dark:ring dark:ring-gray-500 dark:ring-inset px-3 py-2 text-xs text-white";

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        class={props.class || "inline-flex"}
      >
        {props.children}
      </div>

      <Show when={isOpen()}>
        <Portal>
          <div
            style={tooltipStyles()}
            class={tooltipClass}
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
