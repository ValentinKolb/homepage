/**
 * Info Blocks Extension for CodeMirror 6
 *
 * Renders markdown info blocks as formatted HTML widgets when cursor is outside.
 *
 * Features:
 * - Automatic info block rendering with Decoration.replace
 * - Support for info, success, warning, danger block types
 * - Cursor-based toggle between markdown and rendered view
 * - Click on block to edit
 *
 * Syntax:
 * :::info
 * Content here
 * :::
 */

import { StateField, RangeSet } from "@codemirror/state";
import type { EditorState, Extension, Range } from "@codemirror/state";
import { Decoration, EditorView, WidgetType } from "@codemirror/view";
import type { DecorationSet } from "@codemirror/view";

// ==========================
// Types
// ==========================

type BlockType = "note" | "info" | "success" | "warning" | "danger";

type InfoBlockData = {
  type: BlockType;
  content: string;
};

// ==========================
// Block Type Configuration
// ==========================

const blockConfig = {
  note: {
    icon: "ti-chevron-right",
    borderColor: "border-gray-400 dark:border-gray-500",
    color: "text-gray-800 dark:text-gray-300",
  },
  info: {
    icon: "ti-info-circle",
    borderColor: "border-blue-400 dark:border-blue-500",
    color: "text-blue-800 dark:text-blue-300",
  },
  success: {
    icon: "ti-check",
    borderColor: "border-green-400 dark:border-green-500",
    color: "text-green-800 dark:text-green-300",
  },
  warning: {
    icon: "ti-alert-circle",
    borderColor: "border-orange-400 dark:border-orange-500",
    color: "text-orange-700 dark:text-orange-300",
  },
  danger: {
    icon: "ti-alert-hexagon",
    borderColor: "border-red-400 dark:border-red-500",
    color: "text-red-700 dark:text-red-300",
  },
} as const;

// ==========================
// Block Parsing
// ==========================

/**
 * Parse info block text into structured data
 * Handles :::type format with content and closing :::
 */
const parseInfoBlock = (text: string): InfoBlockData | null => {
  const match = text.match(/^:::(\w+)\s*\n([\s\S]*?)\n:::$/);
  if (!match) return null;

  const [, typeStr, content] = match;
  const type = typeStr.toLowerCase() as BlockType;

  // Validate block type
  if (!blockConfig[type]) return null;

  return {
    type,
    content: content.trim(),
  };
};

// ==========================
// Content Rendering
// ==========================

/**
 * Simple markdown-like content rendering
 * Handles basic formatting without full markdown parser
 */
const renderContent = (content: string): string => {
  return (
    content
      // Bold **text**
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      // Italic *text*
      .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>")
      // Code `text`
      .replace(
        /`([^`]+)`/g,
        "<code class='bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-sm'>$1</code>",
      )
      // Line breaks
      .replace(/\n/g, "<br>")
      // Escape remaining HTML
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      // Restore our formatted HTML
      .replace(/&lt;(\/?(strong|em|code|br)[^&]*)&gt;/g, "<$1>")
  );
};

// ==========================
// CodeMirror Widget
// ==========================

/**
 * Widget for rendering formatted info blocks
 */
class InfoBlockWidget extends WidgetType {
  private container: HTMLElement | null = null;

  constructor(private blockData: InfoBlockData) {
    super();
  }

  toDOM() {
    if (!this.container) {
      this.container = document.createElement("div");
      this.container.className = "cm-info-block-widget my-2 cursor-pointer";
      this.container.setAttribute("contenteditable", "false");
      this.container.setAttribute("tabindex", "0");

      const config = blockConfig[this.blockData.type];

      // Main block container
      const block = document.createElement("div");
      block.className = `border-2 ${config.borderColor} px-3 py-2 rounded`;

      // Content wrapper
      const contentWrapper = document.createElement("div");
      contentWrapper.className = "flex items-start";

      // Icon
      const icon = document.createElement("i");
      icon.className = `ti ${config.icon} ${config.color} mr-2 mt-1 flex-shrink-0`;

      // Content area
      const contentDiv = document.createElement("div");
      contentDiv.className = `text-sm leading-relaxed ${config.color}`;
      contentDiv.innerHTML = renderContent(this.blockData.content);

      // Assemble structure
      contentWrapper.appendChild(icon);
      contentWrapper.appendChild(contentDiv);
      block.appendChild(contentWrapper);
      this.container.appendChild(block);
    }

    return this.container;
  }

  eq(other: WidgetType) {
    return (
      other instanceof InfoBlockWidget &&
      other.blockData.type === this.blockData.type &&
      other.blockData.content === this.blockData.content
    );
  }

  ignoreEvent(event: Event) {
    return event.type !== "mousedown";
  }

  get estimatedHeight() {
    // Estimate height based on content length
    const lines = this.blockData.content.split("\n").length;
    return Math.max(60, lines * 20 + 40);
  }
}

// ==========================
// Block Detection & Decoration
// ==========================

/**
 * Find info blocks in document and create replacement decorations
 */
const findInfoBlocks = (state: EditorState): Range<Decoration>[] => {
  const decorations: Range<Decoration>[] = [];
  const [cursor] = state.selection.ranges;

  // Use regex to find info blocks
  const text = state.doc.toString();
  const blockRegex = /^:::(\w+)\s*\n([\s\S]*?)\n:::$/gm;
  let match;

  while ((match = blockRegex.exec(text)) !== null) {
    const blockStart = match.index;
    const blockEnd = blockStart + match[0].length;

    // Skip if cursor is inside this block
    // Include line after for consistency with other extensions
    const nextLine = state.doc.lineAt(Math.min(blockEnd + 1, state.doc.length));
    if (cursor.from >= blockStart && cursor.to <= nextLine.to) {
      continue;
    }

    const blockData = parseInfoBlock(match[0]);

    if (blockData) {
      decorations.push(
        Decoration.replace({
          widget: new InfoBlockWidget(blockData),
          block: true,
        }).range(blockStart, blockEnd),
      );
    }
  }

  return decorations;
};

// ==========================
// Extension Factory
// ==========================

/**
 * Main extension factory
 */
export const infoBlocksExtension = (): Extension => {
  const stateField = StateField.define<DecorationSet>({
    create(state) {
      return RangeSet.of(findInfoBlocks(state), true);
    },

    update(decorations, tr) {
      if (tr.docChanged || tr.selection) {
        return RangeSet.of(findInfoBlocks(tr.state), true);
      }
      return decorations.map(tr.changes);
    },

    provide(field) {
      return EditorView.decorations.from(field);
    },
  });

  const theme = EditorView.theme({
    ".cm-info-block-widget": {
      display: "block",
      margin: "0 !important",
      lineHeight: "1",
    },
  });

  const eventHandlers = EditorView.domEventHandlers({
    mousedown(event, view) {
      const target = event.target as HTMLElement;
      if (target.closest(".cm-info-block-widget")) {
        const pos = view.posAtDOM(target);
        if (pos !== null) {
          view.dispatch({ selection: { anchor: pos } });
          return true;
        }
      }
      return false;
    },
  });

  return [stateField, theme, eventHandlers];
};
