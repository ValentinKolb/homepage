import type { JSX, ParentProps } from "solid-js";

export interface SidebarLayoutProps extends ParentProps {
  /** The sidebar content to display on the left. */
  sidebar: JSX.Element;
  /** The main content to display to the right of the sidebar. */
  children: JSX.Element;
}

/**
 * SidebarLayout renders a responsive two‑column layout.
 *
 * - The outer container uses `h-full` so that the sidebar's height does not exceed its parent.
 * - A hidden checkbox (with Tailwind’s peer classes) controls whether the sidebar is visible.
 * - The sidebar is collapsible on both mobile and desktop.
 * - Instead of a toggle button, a vertical divider (a thin border) is displayed between the sidebar
 *   and the main content. Clicking this divider toggles the sidebar.
 * - The divider shows a right arrow icon when the sidebar is closed and a left arrow icon when open.
 */
export default function SidebarLayout(props: SidebarLayoutProps) {
  return (
    <div class="relative flex max-h-full min-h-full flex-1 overflow-hidden">
      {/* Hidden checkbox controlling toggle state */}
      <input
        id="sidebar-toggle"
        checked
        type="checkbox"
        class="peer/checkbox hidden"
      />

      {/* Vertical divider acting as a toggle control:
          - Displayed as a thin vertical border.
          - Clicking it toggles the sidebar via the hidden checkbox.
          - It shows a right arrow when closed and a left arrow when open.
          - Its left offset moves from 0 (closed) to the sidebar width (open).
      */}
      <label
        for="sidebar-toggle"
        class="peer/label absolute bottom-0 left-0 top-0 z-10 flex h-full w-[10px] cursor-e-resize items-center justify-center py-1 transition-all duration-200 peer-checked/checkbox:left-[256px] peer-checked/checkbox:cursor-w-resize hover:w-[20px] hover:peer-checked/checkbox:left-[246px] [&>*]:rounded-l-none peer-checked/checkbox:[&>*]:rounded-l-lg"
      >
        <div class="flex h-full w-full items-center justify-center rounded-lg bg-white shadow-md peer-checked/checkbox:rounded-r-none">
          <i class="ti ti-grip-vertical text-xs text-gray-500" />
        </div>
      </label>

      {/* Sidebar container:
          Positioned absolutely relative to the parent so that on mobile it takes only the parent's height.
          Fixed width (w-64) and translated off-canvas when closed.
      */}
      <div class="absolute inset-y-0 left-0 w-[256px] -translate-x-full transform p-1 transition-all duration-200 peer-checked/checkbox:translate-x-0 peer-hover/label:w-[246px]">
        {props.sidebar}
      </div>

      {/* Main content area:
          Adds left margin when the sidebar is open.
      */}
      <div class="ml-[10px] flex-1 overflow-hidden p-1 transition-all duration-200 peer-checked/checkbox:ml-[266px] peer-hover/label:pl-[14px] peer-checked/checkbox:peer-hover/label:pl-1">
        {props.children}
      </div>
    </div>
  );
}
