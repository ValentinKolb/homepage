/**
 * Emoji Extension for CodeMirror 6
 *
 * Renders emoji shortcodes like :smile: inline in the editor.
 * Uses emoji-js library for emoji conversion.
 */

import { StateField, RangeSet } from "@codemirror/state";
import type { EditorState, Extension, Range } from "@codemirror/state";
import { Decoration, EditorView, WidgetType } from "@codemirror/view";
import type { DecorationSet } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import EmojiConvertor from "emoji-js";

// Initialize emoji converter
const emojiConverter = new EmojiConvertor();
emojiConverter.replace_mode = "unified";
emojiConverter.allow_native = true;

/**
 * Widget for inline emoji rendering
 */
class InlineEmojiWidget extends WidgetType {
  constructor(
    private shortcode: string,
    private emojiChar: string,
  ) {
    super();
  }

  toDOM() {
    const span = document.createElement("span");
    span.className = "cm-emoji-inline";
    span.setAttribute("data-shortcode", this.shortcode);
    span.textContent = this.emojiChar;
    span.title = this.shortcode;

    return span;
  }

  eq(other: WidgetType) {
    return (
      other instanceof InlineEmojiWidget && other.shortcode === this.shortcode
    );
  }

  ignoreEvent() {
    return false;
  }
}

/**
 * Find and process emoji shortcodes
 */
const findEmojiExpressions = (state: EditorState): Range<Decoration>[] => {
  const decorations: Range<Decoration>[] = [];
  const [cursor] = state.selection.ranges;
  const doc = state.doc.toString();

  // Collect code ranges to exclude
  const codeRanges: { from: number; to: number }[] = [];

  syntaxTree(state).iterate({
    enter: (node) => {
      if (
        node.type.name === "FencedCode" ||
        node.type.name === "InlineCode" ||
        node.type.name === "CodeBlock"
      ) {
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

  // Regex to match emoji shortcodes (emoji-js format)
  // Matches :word: format where word can contain letters, numbers, underscores, and hyphens
  const emojiRegex = /:([a-zA-Z0-9_+-]+):/g;
  let match;

  while ((match = emojiRegex.exec(doc)) !== null) {
    const from = match.index;
    const to = from + match[0].length;
    const fullShortcode = match[0]; // includes the colons

    // Skip if inside code
    if (isInsideCode(from, to)) continue;

    // Skip if cursor is inside this emoji
    if (cursor.from >= from && cursor.to <= to) continue;

    // Try to convert the emoji using emoji-js
    const converted = emojiConverter.replace_colons(fullShortcode);

    // Only create widget if conversion was successful (emoji-js returns the converted emoji)
    if (converted !== fullShortcode) {
      decorations.push(
        Decoration.replace({
          widget: new InlineEmojiWidget(fullShortcode, converted),
        }).range(from, to),
      );
    }
  }

  return decorations;
};

/**
 * State field for managing emoji decorations
 */
const emojiStateField = StateField.define<DecorationSet>({
  create(state) {
    return RangeSet.of(findEmojiExpressions(state), true);
  },

  update(decorations, tr) {
    if (tr.docChanged || tr.selection) {
      return RangeSet.of(findEmojiExpressions(tr.state), true);
    }
    return decorations.map(tr.changes);
  },

  provide(field) {
    return EditorView.decorations.from(field);
  },
});

/**
 * Theme styles for emoji rendering
 */
const emojiTheme = EditorView.theme({
  ".cm-emoji-inline": {
    fontSize: "inherit",
    verticalAlign: "middle",
    userSelect: "none",
  },
});

/**
 * Event handlers for emoji interactions
 */
const emojiEventHandlers = EditorView.domEventHandlers({
  mousedown(event, view) {
    const target = event.target as HTMLElement;

    // Handle emoji clicks - place cursor at emoji position
    if (target.classList.contains("cm-emoji-inline")) {
      const pos = view.posAtDOM(target);
      if (pos !== null) {
        view.dispatch({ selection: { anchor: pos } });
        return true;
      }
    }

    return false;
  },
});

/**
 * Main emoji extension factory
 */
export const emojiExtension = (): Extension => {
  return [emojiStateField, emojiTheme, emojiEventHandlers];
};
