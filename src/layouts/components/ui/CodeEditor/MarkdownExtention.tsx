import { getFileExtension } from "@/lib/utils/fileicons";
import type { CodeEditorExtension } from "./CodejarEditor";
import { createSignal, Show } from "solid-js";
import Tooltip from "../Tooltip";
import MarkdownPreview from "../MarkdownPreview";

/**
 * Prints an html element to a PDF file.
 *
 * @param elementId The ID of the element to print.
 * @param filename The filename of the PDF file.
 */
function printElementToPDF(elementId: string, filename: string) {
  // get the element to print
  const elementToPrint = document.getElementById(elementId);
  if (!elementToPrint) {
    console.error(`Element mit ID "${elementId}" wurde nicht gefunden`);
    return;
  }

  // create a style element for print-specific styles
  const printStyles = document.createElement("style");
  printStyles.setAttribute("type", "text/css");
  printStyles.setAttribute("id", "print-styles-temporary");

  // idea: hide all other elements and ensure the target element uses the full page width
  let printCss = `
    @media print {
      body {
         max-height: none !important;
         overflow: visible !important;
         margin: 10mm;
      }
      header, footer {
        height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      body * {
        visibility: hidden;
      }
      #${elementId}, #${elementId} * {
        visibility: visible;
      }
      #${elementId} {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
      }
      @page {
        size: A4;
      }
    }
  `;

  printStyles.innerHTML = printCss;
  document.head.appendChild(printStyles);

  // set the PDF filename (works in Chrome and some other browsers)
  const originalTitle = document.title;
  document.title = filename;

  // print the element
  window.print();

  // reset the title
  document.title = originalTitle;

  // remove temporary styles
  setTimeout(() => {
    const tempStyles = document.getElementById("print-styles-temporary");
    if (tempStyles) {
      tempStyles.parentNode?.removeChild(tempStyles);
    }
  }, 1000);
}

const createMarkdownExtenstion: CodeEditorExtension = ({ filename, value }) => {
  const enabled = () => ["md", "mdx"].includes(getFileExtension(filename()));
  const [showPreview, setShowPreview] = createSignal(enabled());
  const MarkdownPreviewID = "markdown-preview";

  return {
    Slot: () => (
      <Show when={showPreview() && enabled()}>
        <div class="max-w-[50%] flex-1 overflow-y-auto p-2 px-3">
          <MarkdownPreview id={MarkdownPreviewID} content={value} />
        </div>
      </Show>
    ),
    Controls: () => (
      <Show when={enabled()}>
        <Tooltip
          label={
            <>
              Markdown Vorschau{" "}
              {showPreview() ? (
                "ausblenden"
              ) : (
                <span class="text-green-500">anzeigen</span>
              )}
            </>
          }
        >
          <button
            class={`hover-text ti cursor-pointer self-center ${showPreview() ? "ti-eye-off" : "ti-eye"}`}
            onClick={() => setShowPreview((v) => !v)}
            aria-label="Markdown Vorschau anzeigen/ausblenden"
          />
        </Tooltip>
        {"|"}
        <Show when={showPreview()}>
          <Tooltip label={"Als PDF herunterladen"}>
            <button
              class={`hover-text ti ti-printer cursor-pointer self-center`}
              onClick={async () => {
                printElementToPDF(MarkdownPreviewID, filename());
              }}
              aria-label="Markdown als PDF herunterladen"
            />
          </Tooltip>
          {"|"}
        </Show>
      </Show>
    ),
  };
};

export { createMarkdownExtenstion };
