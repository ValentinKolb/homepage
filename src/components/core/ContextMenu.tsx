import type { ParentProps, JSX } from "solid-js";
import { createSignal, onCleanup, onMount, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { createFloating, offset } from "floating-ui-solid";

type ContextMenuItem = {
  label: string | JSX.Element;
  icon?: JSX.Element;
  onClick?: () => void;
};

export type ContextMenuProps = {
  /** The label to show as the tooltip. Can be a string or a component. */
  children: JSX.Element;
  class?: string;
  items: ContextMenuItem[] | ContextMenuItem[][];
  ref?: ((el: HTMLDivElement) => void) | undefined;
} & ParentProps;

/**
 * ConextMenu component using Floating UI
 *
 * Wraps its children in a container that shows a context menu on right click.
 * Uses SolidJS Portal to avoid overflow-hidden issues.
 * Uses Floating UI for positioning.
 */
export default function ContextMenu(props: ContextMenuProps) {
  const [isOpen, setIsOpen] = createSignal(false);
  const [cursorPosition, setCursorPosition] = createSignal({ x: 0, y: 0 });

  // Setup Floating UI
  const { refs, floatingStyles } = createFloating({
    placement: "bottom-start",
    isOpen: isOpen,
    middleware: () => [offset(0)],
  });

  const onContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCursorPosition({ x: e.clientX, y: e.clientY });
    setIsOpen(true);
  };

  const handleClickOutside = () => {
    setIsOpen(false);
  };

  onMount(() => {
    // handle click outside event to close menu
    document.addEventListener("click", handleClickOutside);
  });

  onCleanup(() => {
    document.removeEventListener("click", handleClickOutside);
  });

  // menu styles
  const menuClasses = `z-50 rounded-lg bg-black/30 backdrop-blur-sm ring dark:ring-gray-800
    ring-gray-300 ring-inset text-xs text-white whitespace-normal break-words overflow-hidden
    [&>.menu-section:not(:last-child)]:border-b dark:[&>.menu-section:not(:last-child)]:border-gray-800
    `;

  // menu item styles
  const menuItemClasses =
    "cursor-pointer m-1 px-2 py-1 rounded-md hover:bg-white hover:text-black dark:hover:text-white dark:hover:bg-gray-800";

  return (
    <>
      <div
        class={props.class}
        ref={(r) => {
          refs.setReference(r);
          props.ref?.(r);
        }}
        onContextMenu={(e) => {
          onContextMenu(e);
        }}
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
              top: cursorPosition().y + "px",
              left: cursorPosition().x + "px",
              transform: "none",
            }}
            class={menuClasses}
          >
            {props.items.map((item) => {
              const render = (i: ContextMenuItem) => (
                <div class={menuItemClasses} onClick={i.onClick}>
                  {i.icon && <span class="mr-2">{i.icon}</span>}
                  {i.label}
                </div>
              );

              if (Array.isArray(item)) {
                return (
                  <div class="menu-section">
                    {item.map((subItem) => render(subItem))}
                  </div>
                );
              }
              return render(item);
            })}
          </div>
        </Portal>
      </Show>
    </>
  );
}
