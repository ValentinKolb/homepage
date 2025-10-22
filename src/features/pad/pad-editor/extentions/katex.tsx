/**
 * KaTeX Extension for CodeMirror 6
 *
 * Renders mathematical expressions using KaTeX.
 * Supports inline and block math with multiple syntax formats.
 *
 * Features:
 * - Inline math: $...$ and \(...\)
 * - Block math: $$...$$ and \[...\]
 * - Code blocks with math language
 * - Cursor-based toggle between rendered and source
 */

import { syntaxTree } from "@codemirror/language";
import type { EditorState, Extension, Range } from "@codemirror/state";
import { RangeSet, StateField } from "@codemirror/state";
import type { DecorationSet } from "@codemirror/view";
import { Decoration, EditorView, WidgetType } from "@codemirror/view";
import katex from "katex";
import "katex/dist/katex.min.css";

/**
 * Widget for inline math rendering
 */
class InlineMathWidget extends WidgetType {
  constructor(private latex: string) {
    super();
  }

  toDOM() {
    const span = document.createElement("span");
    span.className = "cm-katex-inline";

    try {
      katex.render(this.latex, span, {
        throwOnError: false,
        displayMode: false,
      });
    } catch (error) {
      span.innerHTML = `<span class="cm-katex-error text-red-500">$${this.latex}$</span>`;
    }

    return span;
  }

  ignoreEvent(event: Event) {
    return event.type !== "mousedown";
  }

  eq(other: WidgetType) {
    return other instanceof InlineMathWidget && other.latex === this.latex;
  }
}

/**
 * Widget for block math rendering
 */
class BlockMathWidget extends WidgetType {
  constructor(private latex: string) {
    super();
  }

  toDOM() {
    const container = document.createElement("div");
    container.className = "cm-katex-block !m-0";
    container.setAttribute("contenteditable", "false");

    const wrapper = document.createElement("div");
    wrapper.className = "p-1 overflow-x-auto flex items-center justify-center";

    const mathDiv = document.createElement("div");
    mathDiv.className = "text-center";

    try {
      katex.render(this.latex, mathDiv, {
        throwOnError: false,
        displayMode: true,
      });
    } catch (error) {
      mathDiv.innerHTML = `
        <div class="text-red-500 font-mono text-sm">
          <i class="ti ti-alert-circle"></i> Invalid LaTeX
          <pre class="mt-2">${this.latex}</pre>
        </div>
      `;
    }

    wrapper.appendChild(mathDiv);
    container.appendChild(wrapper);

    return container;
  }

  eq(other: WidgetType) {
    return other instanceof BlockMathWidget && other.latex === this.latex;
  }

  ignoreEvent(event: Event) {
    return event.type !== "mousedown";
  }
}

/**
 * Find and process block math expressions (inline handled by plugin)
 */
const findBlockMathExpressions = (state: EditorState): Range<Decoration>[] => {
  const decorations: Range<Decoration>[] = [];
  const [cursor] = state.selection.ranges;
  const doc = state.doc.toString();

  // Collect code ranges to exclude
  const codeRanges: { from: number; to: number }[] = [];

  // Process code blocks with math language and collect all code ranges
  syntaxTree(state).iterate({
    enter: (node) => {
      // Collect all code blocks
      if (node.type.name === "FencedCode") {
        codeRanges.push({ from: node.from, to: node.to });

        const text = state.sliceDoc(node.from, node.to);
        const lines = text.split("\n");
        const language =
          lines[0]?.replace("```", "").trim().toLowerCase() || "";

        if (language === "math") {
          // Skip if cursor is inside
          if (cursor.from >= node.from && cursor.to <= node.to) {
            return false;
          }

          const latex = lines.slice(1, -1).join("\n");
          decorations.push(
            Decoration.replace({
              widget: new BlockMathWidget(latex),
              block: true,
            }).range(node.from, node.to),
          );
        }
      }
      // Collect inline code ranges
      if (node.type.name === "InlineCode") {
        codeRanges.push({ from: node.from, to: node.to });
      }
    },
  });

  // Helper to check if a position is inside code
  const isInsideCode = (from: number, to: number): boolean => {
    return codeRanges.some(
      (range) =>
        (from >= range.from && from < range.to) ||
        (to > range.from && to <= range.to) ||
        (from <= range.from && to >= range.to),
    );
  };

  // Process only block math with regex (inline handled by plugin)
  const blockMathRegex = /\$\$([^$]+)\$\$|\\\[(.*?)\\\]/gs;

  // Block math ($$...$$ and \[...\])
  let match;
  while ((match = blockMathRegex.exec(doc)) !== null) {
    const from = match.index;
    const to = from + match[0].length;
    const latex = match[1] || match[2];

    // Skip if inside code
    if (isInsideCode(from, to)) {
      continue;
    }

    // Skip if cursor is inside
    if (cursor.from >= from && cursor.to <= to) {
      continue;
    }

    decorations.push(
      Decoration.replace({
        widget: new BlockMathWidget(latex),
        block: true,
      }).range(from, to),
    );
  }

  return decorations;
};

/**
 * Find and process inline math expressions
 */
const findInlineMathExpressions = (state: EditorState): Range<Decoration>[] => {
  const decorations: Range<Decoration>[] = [];
  const [cursor] = state.selection.ranges;
  const doc = state.doc.toString();

  // Collect code ranges to exclude
  const codeRanges: { from: number; to: number }[] = [];

  syntaxTree(state).iterate({
    enter: (node) => {
      if (node.type.name === "FencedCode" || node.type.name === "InlineCode") {
        codeRanges.push({ from: node.from, to: node.to });
      }
    },
  });

  const isInsideCode = (from: number, to: number): boolean => {
    return codeRanges.some(
      (range) =>
        (from >= range.from && from < range.to) ||
        (to > range.from && to <= range.to),
    );
  };

  // Process inline math
  const inlineMathRegex = /(?<!\$)\$(?!\$)([^$]+)\$(?!\$)|\\\((.*?)\\\)/g;
  let match;

  while ((match = inlineMathRegex.exec(doc)) !== null) {
    const from = match.index;
    const to = from + match[0].length;
    const latex = match[1] || match[2];

    // Skip if inside code or cursor
    if (isInsideCode(from, to)) continue;
    if (cursor.from >= from && cursor.to <= to) continue;

    // Use widget instead of mark for inline math
    decorations.push(
      Decoration.replace({
        widget: new InlineMathWidget(latex),
      }).range(from, to),
    );
  }

  return decorations;
};

/**
 * Main extension factory
 */
export const katexExtension = (): Extension => {
  const stateField = StateField.define<DecorationSet>({
    create(state) {
      const blockMath = findBlockMathExpressions(state);
      const inlineMath = findInlineMathExpressions(state);
      return RangeSet.of([...blockMath, ...inlineMath], true);
    },

    update(decorations, tr) {
      if (tr.docChanged || tr.selection) {
        const blockMath = findBlockMathExpressions(tr.state);
        const inlineMath = findInlineMathExpressions(tr.state);
        return RangeSet.of([...blockMath, ...inlineMath], true);
      }
      return decorations.map(tr.changes);
    },

    provide(field) {
      return EditorView.decorations.from(field);
    },
  });

  const theme = EditorView.theme({
    ".cm-katex-inline": {
      display: "inline-block",
      padding: "0 4px",
      borderRadius: "var(--radius-sm)",
      lineHeight: "1",
    },
    ".cm-katex-inline:hover": {
      background: "rgba(59, 130, 246, 0.05)",
    },
    ".cm-katex-block": {
      display: "block",
      margin: "0 !important",
      borderRadius: "var(--radius-sm)",
    },
    ".cm-katex-block:hover": {
      background: "rgba(59, 130, 246, 0.05)",
    },
    ".cm-katex-error": {
      fontFamily: "var(--font-mono)",
      fontSize: "0.875em",
      padding: "0 2px",
    },
  });

  const eventHandlers = EditorView.domEventHandlers({
    mousedown(event, view) {
      const target = event.target as HTMLElement;

      // Handle block math clicks
      if (target.closest(".cm-katex-block")) {
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
