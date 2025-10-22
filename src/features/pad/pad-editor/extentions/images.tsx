/**
 * Image Extension for CodeMirror 6
 *
 * Renders markdown images as actual images when cursor is outside.
 * Click on image to edit the markdown syntax.
 *
 * Features:
 * - Automatic image rendering with Decoration.replace
 * - Cursor-based toggle between markdown and rendered view
 * - Click on image to edit
 *
 * Technical approach:
 * - Uses syntaxTree to find Image nodes
 * - Replaces markdown with widget when cursor is outside
 * - Same pattern as tables extension
 *
 * @see https://codemirror.net/docs/ref/#view.Decoration
 */

import { syntaxTree } from "@codemirror/language";
import { StateField, RangeSet } from "@codemirror/state";
import type { EditorState, Extension, Range } from "@codemirror/state";
import { Decoration, EditorView, WidgetType } from "@codemirror/view";
import type { DecorationSet } from "@codemirror/view";

/**
 * Widget for rendering images
 */
class ImageWidget extends WidgetType {
  constructor(
    private url: string,
    private alt: string,
  ) {
    super();
  }

  toDOM() {
    const container = document.createElement("div");
    container.className = "cm-image-widget my-2 cursor-pointer";
    container.setAttribute("contenteditable", "false");
    container.setAttribute("tabindex", "0");

    const figure = document.createElement("figure");
    figure.className = "flex flex-col items-center justify-center max-w-full";

    const img = document.createElement("img");
    img.className =
      "block max-h-[400px] rounded border border-gray-200 dark:border-gray-700";
    img.src = this.url;
    img.alt = this.alt || "";
    img.loading = "lazy";

    // Add alt text as caption if available
    if (this.alt) {
      const caption = document.createElement("figcaption");
      caption.className =
        "text-sm text-gray-500 dark:text-gray-400 mt-2 italic";
      caption.textContent = this.alt;
      figure.appendChild(img);
      figure.appendChild(caption);
    } else {
      figure.appendChild(img);
    }

    container.appendChild(figure);
    return container;
  }

  eq(other: WidgetType) {
    return (
      other instanceof ImageWidget &&
      other.url === this.url &&
      other.alt === this.alt
    );
  }

  ignoreEvent(event: Event) {
    return event.type !== "mousedown";
  }
}

/**
 * Find images in document and create replacement decorations
 */
const findMarkdownImages = (state: EditorState): Range<Decoration>[] => {
  const decorations: Range<Decoration>[] = [];
  const [cursor] = state.selection.ranges;

  syntaxTree(state).iterate({
    enter: (node) => {
      if (node.type.name !== "Image") return;

      // Skip if cursor is inside this image markdown
      // Include line after for consistency with tables
      const nextLine = state.doc.lineAt(
        Math.min(node.to + 1, state.doc.length),
      );
      if (cursor.from >= node.from && cursor.to <= nextLine.to) {
        return false;
      }

      // Parse image markdown: ![alt](url)
      const text = state.sliceDoc(node.from, node.to);
      const match = text.match(/!\[([^\]]*)\]\(([^)]+)\)/);

      if (match) {
        const [, alt, url] = match;

        decorations.push(
          Decoration.replace({
            widget: new ImageWidget(url, alt),
            block: true,
          }).range(node.from, node.to),
        );
      }
    },
  });

  return decorations;
};

/**
 * Main extension factory
 */
export const imageExtension = (): Extension => {
  const stateField = StateField.define<DecorationSet>({
    create(state) {
      return RangeSet.of(findMarkdownImages(state), true);
    },

    update(decorations, tr) {
      if (tr.docChanged || tr.selection) {
        return RangeSet.of(findMarkdownImages(tr.state), true);
      }
      return decorations.map(tr.changes);
    },

    provide(field) {
      return EditorView.decorations.from(field);
    },
  });

  const theme = EditorView.theme({
    ".cm-image-widget": {
      display: "block",
      margin: "0 !important",
      lineHeight: "1",
    },
    ".cm-image-widget:focus": {
      outline: "2px solid var(--color-blue-500)",
      outlineOffset: "2px",
      borderRadius: "4px",
    },
  });

  const eventHandlers = EditorView.domEventHandlers({
    mousedown(event, view) {
      const target = event.target as HTMLElement;
      if (target.closest(".cm-image-widget")) {
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
