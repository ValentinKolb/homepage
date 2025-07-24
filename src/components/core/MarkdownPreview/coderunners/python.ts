import { loadPyodide, type PyodideInterface } from "pyodide";
import type { CodeRunner, Output } from ".";

let globalPyodide: PyodideInterface | null = null;

// Matplotlib Setup Code
const MATPLOTLIB_SETUP = `
import matplotlib
import matplotlib.pyplot as plt
import io, base64
import js

# Use AGG backend for pyodide
plt.close('all')  # Alle figures schließen vor switch
matplotlib.use('Agg')

_original_show = plt.show

def patched_show(*args, **kwargs):
    """Patched plt.show() - creates base64 image"""
    try:
        fig = plt.gcf()

        if fig.get_axes():  # only show if content exists
            buf = io.BytesIO()
            fig.savefig(buf, format='png', dpi=150, bbox_inches='tight')
            buf.seek(0)
            img_b64 = base64.b64encode(buf.read()).decode()

            # use js function to handle the plot
            js.handleMatplotlibPlot(img_b64)

        plt.close(fig)  # close figure

    except Exception as e:
        print(f"Plot error: {e}")

# Path to js function
plt.show = patched_show
`;

export const pythonRunner: CodeRunner = {
  language: "python",

  async initialize() {
    if (globalPyodide) return;

    globalPyodide = await loadPyodide({
      packages: ["micropip", "numpy", "pandas", "matplotlib", "requests"],
      indexURL: "/pyodide/",
    });

    await globalPyodide.runPythonAsync(MATPLOTLIB_SETUP);
  },

  async execute(code: string, output: Output) {
    if (!globalPyodide) {
      await this.initialize!();
    }

    patchMatplotlib(output);

    globalPyodide!.setStdin({ stdin: () => prompt() });
    globalPyodide!.setStdout({
      batched: (msg: string) => output.appendString(msg),
    });
    globalPyodide!.setStderr({
      batched: (msg: string) => output.appendString(msg, { level: "error" }),
    });

    const result = await globalPyodide!.runPythonAsync(code);
    if (result !== undefined && result !== null) {
      output.appendString(String(result));
    }
  },
};

const patchMatplotlib = (output: Output) => {
  window.handleMatplotlibPlot = function (base64Image: string) {
    const plotDiv = document.createElement("div");
    plotDiv.className = "relative mt-2 p-0";
    plotDiv.innerHTML = `<img src="data:image/png;base64,${base64Image}"
              class="rounded-sm shadow-sm max-w-full relative !m-0"
              >`;
    const removeBtn = document.createElement("button");
    removeBtn.ariaLabel = "remove/hide plot";
    removeBtn.className =
      "absolute top-1 right-1 text-gray-500 text-sm hover:text-red-500 ti ti-trash";
    removeBtn.addEventListener("click", () => {
      output.removeElement(plotDiv);
    });
    plotDiv.appendChild(removeBtn);

    output.appendElement(plotDiv);
  };
};

declare global {
  interface Window {
    handleMatplotlibPlot: (base64Image: string) => void;
  }
}
