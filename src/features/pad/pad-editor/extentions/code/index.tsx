/**
 * Code Extension for CodeMirror 6
 *
 * Adds executable code blocks with run buttons.
 * Supports multiple languages through code runners.
 *
 * Features:
 * - Run button for supported languages
 * - Copy code functionality
 * - Output display
 */

import { syntaxTree } from "@codemirror/language";
import { RangeSet, StateField } from "@codemirror/state";
import { Decoration, EditorView, WidgetType } from "@codemirror/view";
import type { EditorState, Extension, Range } from "@codemirror/state";
import type { DecorationSet } from "@codemirror/view";
import { Output } from "./coderunners/output-builder";
import { createCodeRunner, executeCodeSupportedLanguages } from "./coderunners";
import { kitAutocomplete } from "./autocomplete/kit-autocomplete";
import { jsAutocomplete } from "./autocomplete/js-autocomplete";
import { common } from "@/lib/utils/crypto";

interface CodeBlockParams {
  code: string;
  language: string;
}

/**
 * Widget for code block execution UI
 */
class CodeBlockWidget extends WidgetType {
  hasRun: boolean;
  readonly id: string;
  private mainOutput: Output;
  private afterExecute: undefined | (() => void) = undefined;

  constructor(params: CodeBlockParams) {
    super();
    this.hasRun = false;
    this.id = common.fnv1aHash(params.code + params.language);
    this.mainOutput = this.createContainer(params);
  }

  eq(other: CodeBlockWidget) {
    return other.id === this.id && !this.hasRun;
  }

  private createContainer({ code, language }: CodeBlockParams) {
    const widgetContainer = document.createElement("div");
    widgetContainer.className = "my-1";
    const output = new Output(widgetContainer);

    // Create buttons row
    const btnRow = output.new({ layout: "row", justify: "between" });
    const codeOutput = output.new().hide();
    const secondaryRow = output.new({ layout: "row", justify: "start" }).hide();

    const executeCode = createCodeRunner({
      code: code,
      language: language,
      output: codeOutput,
    });

    // Run button
    btnRow
      .button({
        label: "Run Code",
        icon: "ti ti-player-play",
        variant: "primary",
        onClick: ({ label, icon }) => {
          if (icon) icon.className = "ti ti-loader animate-spin";
          label.textContent = "Running...";
          setTimeout(() => {
            executeCode?.().finally(() => {
              this.hasRun = true;
              secondaryRow.show();
              this.afterExecute?.();
              setTimeout(() => {
                if (icon) icon.className = "ti ti-player-play";
                label.textContent = "Run Code";
              }, 200);
            });
          });
        },
      })
      .button({
        label: "Copy Code",
        icon: "ti ti-copy",
        variant: "secondary",
        onClick: ({ icon }) => {
          navigator.clipboard.writeText(code);
          if (icon) icon.className = "ti ti-copy-check";
          setTimeout(() => {
            if (icon) icon.className = "ti ti-copy";
          }, 2000);
        },
      });

    // Clear button
    secondaryRow
      .button({
        label: "Clear",
        icon: "ti ti-x",
        variant: "subtle",
        onClick: () => {
          codeOutput.clear();
          codeOutput.hide();
          secondaryRow.hide();
        },
      })
      .button({
        label: "Copy",
        icon: "ti ti-copy",
        variant: "subtle",
        onClick: ({ icon }) => {
          navigator.clipboard.writeText(codeOutput.getTextContent());
          if (icon) icon.className = "ti ti-copy-check";
          setTimeout(() => {
            if (icon) icon.className = "ti ti-copy";
          }, 2000);
        },
      });

    return output;
  }

  toDOM(view: EditorView) {
    this.afterExecute = view.requestMeasure;
    return this.mainOutput.getContainer();
  }
}

/**
 * Main extension factory
 */
const codeExtension = (): Extension => {
  const decorate = (state: EditorState) => {
    const widgets: Range<Decoration>[] = [];

    syntaxTree(state).iterate({
      enter: ({ type, from, to }) => {
        if (type.name !== "FencedCode") return;

        // extract code block content and language
        const text = state.doc.sliceString(from, to);
        const lines = text.split("\n");
        const language =
          lines[0]?.replace("```", "").trim().toLowerCase() || "";
        const code = lines.slice(1, -1).join("\n");

        // not all languages are supported
        if (!executeCodeSupportedLanguages.includes(language)) return;

        // add code block decoration
        widgets.push(
          Decoration.widget({
            widget: new CodeBlockWidget({ code, language }),
            side: -1,
            block: true,
          }).range(state.doc.lineAt(from).from),
        );

        // don't iterate over children
        return false;
      },
    });

    return widgets.length > 0 ? RangeSet.of(widgets) : Decoration.none;
  };

  const codeBlocksField = StateField.define<DecorationSet>({
    create(state) {
      return decorate(state);
    },
    update(decorations, transaction) {
      if (transaction.docChanged) {
        return decorate(transaction.state);
      }
      return decorations.map(transaction.changes);
    },
    provide(field) {
      return EditorView.decorations.from(field);
    },
  });

  return [codeBlocksField, jsAutocomplete(), kitAutocomplete()];
};

export { codeExtension };
