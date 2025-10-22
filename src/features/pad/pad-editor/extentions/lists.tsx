/**
 * Lists Extension for CodeMirror 6
 *
 * Formats markdown lists with custom styling and interactive checkboxes.
 * Handles bullet lists, numbered lists, and task lists with indentation.
 *
 * Features:
 * - Visual indentation guides
 * - Clickable checkboxes for task lists
 * - Custom bullet points
 * - Proper indentation handling
 */

import { syntaxTree } from "@codemirror/language";
import { StateField } from "@codemirror/state";
import type { EditorState, Extension, Range } from "@codemirror/state";
import {
  Decoration,
  EditorView,
  ViewPlugin,
  WidgetType,
} from "@codemirror/view";
import type { DecorationSet } from "@codemirror/view";
import type { SyntaxNodeRef } from "@lezer/common";

const tabSize = 2;

/**
 * Widget for indentation spacing
 */
class SpacerWidget extends WidgetType {
  toDOM() {
    const spacer = document.createElement("span");
    spacer.className = "custom-list-indent";
    spacer.style.cssText =
      "width: 2rem; text-decoration: none; display: inline-flex;";

    const line = document.createElement("span");
    line.className = "custom-list-indent-marker";
    line.innerHTML = "&nbsp;";

    spacer.appendChild(line);
    return spacer;
  }
}

/**
 * Widget for bullet point rendering
 */
class DotWidget extends WidgetType {
  toDOM() {
    const wrapper = document.createElement("label");
    wrapper.className = "custom-list-marker";
    wrapper.style.minWidth = "1rem";
    wrapper.setAttribute("aria-hidden", "true");
    wrapper.setAttribute("inert", "true");
    wrapper.innerHTML = "&bull;";
    return wrapper;
  }
}

/**
 * Widget for interactive task checkboxes
 */
class TaskWidget extends WidgetType {
  constructor(private checked: boolean) {
    super();
  }

  toDOM() {
    const wrapper = document.createElement("label");
    wrapper.className = "custom-list-marker custom-list-task";
    wrapper.style.minWidth = "2rem";
    wrapper.setAttribute("aria-hidden", "true");

    const input = document.createElement("input");
    input.className = "custom-list-task-marker";
    input.type = "checkbox";
    input.checked = this.checked;
    input.style.transform = "translateY(1px)";
    input.setAttribute("aria-hidden", "true");
    input.setAttribute("tabindex", "-1");

    wrapper.appendChild(input);
    return wrapper;
  }

  eq(other: WidgetType) {
    return other instanceof TaskWidget && other.checked === this.checked;
  }

  ignoreEvent() {
    return false;
  }
}

/**
 * Extract list information from syntax node
 */
const getListInfo = (state: EditorState, { from, to, type }: SyntaxNodeRef) => {
  if (type.name === "Blockquote") {
    return false;
  }

  if (type.name !== "ListMark") {
    return;
  }

  const line = state.doc.lineAt(from);
  const lineStart = line.from;
  const marker = state.sliceDoc(from, to);
  const markerStart = from;
  const markerEnd = to;
  const markerHasTrailingSpace =
    state.sliceDoc(markerEnd, markerEnd + 1) === " ";
  const indentation = markerStart - lineStart;

  if (!markerHasTrailingSpace) {
    return;
  }

  const indentLevel = Math.floor(indentation / tabSize);
  const spacerDecorations: Range<Decoration>[] = [];

  for (let i = 0; i < indentLevel; i++) {
    const from = lineStart + i * tabSize;
    const to = from + tabSize;
    spacerDecorations.push(
      Decoration.replace({ widget: new SpacerWidget() }).range(from, to),
    );
  }

  return {
    indentLevel,
    lineStart,
    marker,
    markerEnd,
    markerStart,
    spacerDecorations,
  };
};

/**
 * Extension for bullet list formatting
 */
const bulletLists = (): Extension => {
  const decorate = (state: EditorState): [DecorationSet, DecorationSet] => {
    const atomicRanges: Range<Decoration>[] = [];
    const decorationRanges: Range<Decoration>[] = [];

    syntaxTree(state).iterate({
      enter: (node) => {
        const result = getListInfo(state, node);
        if (!result) return;

        const {
          indentLevel,
          lineStart,
          marker,
          markerEnd,
          markerStart,
          spacerDecorations,
        } = result;

        if (!["-", "*"].includes(marker)) {
          return;
        }

        const lineDec = Decoration.line({
          attributes: {
            class: "custom-list custom-list-bullet",
            style: `--indent-level: ${indentLevel}`,
          },
        }).range(lineStart);

        decorationRanges.push(lineDec);
        decorationRanges.push(...spacerDecorations);
        atomicRanges.push(...spacerDecorations);

        const textStart = markerEnd + 1;
        const dotDec = Decoration.replace({
          widget: new DotWidget(),
        }).range(markerStart, textStart);

        decorationRanges.push(dotDec);
        atomicRanges.push(dotDec);
      },
    });

    return [
      Decoration.set(decorationRanges, true),
      Decoration.set(atomicRanges, true),
    ];
  };

  return StateField.define<[DecorationSet, DecorationSet]>({
    create(state) {
      return decorate(state);
    },
    update(_, { state }) {
      return decorate(state);
    },
    provide(field) {
      return [
        EditorView.decorations.of((view) => view.state.field(field)[0]),
        EditorView.atomicRanges.of((view) => view.state.field(field)[1]),
      ];
    },
  });
};

/**
 * Extension for task list formatting with interactive checkboxes
 */
const taskLists = (): Extension => {
  const decorate = (state: EditorState): [DecorationSet, DecorationSet] => {
    const atomicRanges: Range<Decoration>[] = [];
    const decorationRanges: Range<Decoration>[] = [];

    syntaxTree(state).iterate({
      enter: (node) => {
        const result = getListInfo(state, node);
        if (!result) return;

        const {
          indentLevel,
          lineStart,
          marker,
          markerEnd,
          markerStart,
          spacerDecorations,
        } = result;

        if (!["-", "*"].includes(marker)) {
          return;
        }

        const taskStart = markerEnd + 1;
        const taskEnd = taskStart + 3;
        const task = state.sliceDoc(taskStart, taskEnd);

        if (!["[ ]", "[x]"].includes(task)) {
          return;
        }

        const textStart = taskEnd + 1;
        const taskHasTrailingSpace = state.sliceDoc(taskEnd, textStart) === " ";

        if (!taskHasTrailingSpace) {
          return;
        }

        const isChecked = task === "[x]";

        const lineDec = Decoration.line({
          attributes: {
            class: `custom-list custom-list-task ${isChecked ? "custom-list-task-checked" : "custom-list-task-unchecked"}`,
            style: `--indent-level: ${indentLevel}`,
          },
        }).range(lineStart);

        decorationRanges.push(lineDec);
        decorationRanges.push(...spacerDecorations);
        atomicRanges.push(...spacerDecorations);

        const taskDec = Decoration.replace({
          widget: new TaskWidget(isChecked),
        }).range(markerStart, taskEnd + 1);

        decorationRanges.push(taskDec);
        atomicRanges.push(taskDec);
      },
    });

    return [
      Decoration.set(decorationRanges, true),
      Decoration.set(atomicRanges, true),
    ];
  };

  const viewPlugin = ViewPlugin.define(() => ({}), {
    eventHandlers: {
      mousedown: (event, view) => {
        const target = event.target as HTMLElement;
        const taskMarker = target.closest(
          ".custom-list-task-marker",
        ) as HTMLInputElement;

        if (taskMarker?.type === "checkbox") {
          const position = view.posAtDOM(taskMarker);
          const from = position - 4;
          const to = position - 1;
          const before = view.state.sliceDoc(from, to);

          const newText = before === "[ ]" ? "[x]" : "[ ]";

          view.dispatch({
            changes: { from, to, insert: newText },
          });

          return true;
        }
      },
    },
  });

  const stateField = StateField.define<[DecorationSet, DecorationSet]>({
    create(state) {
      return decorate(state);
    },
    update(_, { state }) {
      return decorate(state);
    },
    provide(field) {
      return [
        EditorView.decorations.of((view) => view.state.field(field)[0]),
        EditorView.atomicRanges.of((view) => view.state.field(field)[1]),
      ];
    },
  });

  return [viewPlugin, stateField];
};

/**
 * Theme styles for list formatting
 */
const listTheme = EditorView.theme({
  ".custom-list-indent": {
    display: "inline-flex",
    justifyContent: "center",
  },
  ".custom-list-indent-marker": {
    borderLeft: "1px solid rgba(107, 114, 128, 0.2)",
    bottom: "0",
    overflow: "hidden",
    position: "absolute",
    top: "0",
    width: "0",
  },
  ".custom-list": {
    paddingLeft: "calc(var(--indent-level) * 2rem + 2rem) !important",
    position: "relative",
    textIndent: "calc((var(--indent-level) * 2rem + 2rem) * -1)",
  },
  ".custom-list *": {
    textIndent: "0",
  },
  ".custom-list-marker": {
    alignItems: "center",
    color: "var(--color-gray-500)",
    display: "inline-flex",
    justifyContent: "center",
    minWidth: "2rem",
    fontWeight: "bold",
  },
  ".custom-list-task-marker": {
    scale: "1",
    transformOrigin: "center center",
  },
  ".custom-list-task-checked": {
    textDecoration: "line-through",
    textDecorationColor: "var(--color-gray-500)",
    opacity: "0.7",
  },
});

/**
 * Main extension factory
 */
export const listsExtension = (): Extension => {
  return [taskLists(), bulletLists(), listTheme];
};
