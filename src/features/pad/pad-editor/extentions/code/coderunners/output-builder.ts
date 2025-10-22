// ==========================
// Type Definitions
// ==========================

import { createTable } from "../../tables";

export interface ButtonOptions {
  label?: string;
  icon?: string;
  variant?: "primary" | "secondary" | "subtle";
  disabled?: boolean;
  onClick: (elements: {
    label: HTMLSpanElement;
    icon: HTMLElement | null;
  }) => void;
}

export interface NewOptions {
  layout?: "col" | "row";
  border?: boolean;
  align?: "start" | "center" | "end";
  justify?: "start" | "center" | "end" | "between" | "around";
}

// ==========================
// Output Implementation
// ==========================

export class Output {
  constructor(private container: HTMLElement) {
    this.container.classList.add(
      "output-container",
      "flex",
      "flex-col",
      "gap-2",
    );
  }

  /**
   * Add text to output
   */
  text(
    content: string,
    style: "default" | "info" | "warn" | "error" = "default",
    size?: "small" | "default" | "large",
  ): this {
    const p = document.createElement("p");
    p.className = "!m-0";
    p.textContent = content;

    if (style === "error") {
      p.classList.add("text-red-500", "dark:text-red-400");
    } else if (style === "info") {
      p.classList.add("text-dimmed", "text-xs");
    } else if (style === "warn") {
      p.classList.add("text-orange-500", "dark:text-orange-400");
    }

    if (size === "small") {
      p.classList.add("text-xs");
    } else if (size === "large") {
      p.classList.add("text-lg");
    }

    this.container.appendChild(p);
    return this;
  }

  /**
   * Create a new child Output container
   */
  new(opts?: NewOptions): Output {
    const container = document.createElement("div");
    const options = opts || {};

    // Base classes
    const classes = ["flex"];

    // Layout
    if (options.layout === "row") {
      classes.push("flex-row", "items-center", "gap-2");
    } else {
      classes.push("flex-col", "gap-2");
    }

    // Border
    if (options.border) {
      classes.push(
        "border",
        "dark:border-gray-700",
        "border-gray-200",
        "rounded",
        "py-2 px-3",
      );
    }

    // Alignment
    if (options.align) {
      const alignClasses = {
        start: "items-start",
        center: "items-center",
        end: "items-end",
      };
      classes.push(alignClasses[options.align]);
    }

    // Justify
    if (options.justify) {
      const justifyClasses = {
        start: "justify-start",
        center: "justify-center",
        end: "justify-end",
        between: "justify-between",
        around: "justify-around",
      };
      classes.push(justifyClasses[options.justify]);
    }

    container.className = classes.join(" ");
    this.container.appendChild(container);

    return new Output(container);
  }

  /**
   * Add table to output
   */
  table(
    data: unknown,
    options?: {
      columns?: string[];
      perPage?: number;
      initialPage?: number;
    },
  ): this {
    const tableData = normalizeToTableData(data, options?.columns);
    // Use createTable from tables extension
    const tableElement = createTable(tableData, options?.perPage || 20);
    this.container.appendChild(tableElement);
    return this;
  }

  /**
   * Add image to output
   */
  image(src: string, alt: string = ""): this {
    const img = document.createElement("img");
    img.src = src;
    img.alt = alt;
    img.className = "rounded border border-gray-200 dark:border-gray-700";
    img.style.maxWidth = "600px";
    img.style.width = "100%";
    img.style.height = "auto";
    this.container.appendChild(img);
    return this;
  }

  /**
   * Add custom HTML element
   */
  element(el: HTMLElement): this {
    this.container.appendChild(el);
    return this;
  }

  /**
   * Add or update a progress bar
   */
  progress(label: string, percent: number): this {
    // Clamp percent to 0-100
    const clampedPercent = Math.max(0, Math.min(100, percent));

    // Try to find existing progress bar with this label
    let container: HTMLElement | null = null;
    let progressBar: HTMLElement | null = null;

    for (const bar of this.container.querySelectorAll(".progress-container")) {
      if (
        bar
          .querySelector(".progress-label")
          ?.textContent?.trim()
          .toLowerCase() === label.toLowerCase()
      ) {
        container = bar as HTMLElement;
        break;
      }
    }

    // Create new container if not found
    if (!container) {
      container = document.createElement("div");
      container.className = "progress-container flex flex-col gap-1";

      const labelWrapper = document.createElement("div");
      labelWrapper.className = "flex items-center gap-1";

      const labelEl = document.createElement("span");
      labelEl.className = "progress-label text-xs text-dimmed";
      labelEl.textContent = label;

      labelWrapper.appendChild(labelEl);

      const barWrapper = document.createElement("div");
      barWrapper.className =
        "progress-bar-wrapper w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden";

      progressBar = document.createElement("div");
      progressBar.className =
        "progress-bar bg-gradient-to-r from-blue-500 to-green-500 dark:from-blue-400 dark:to-green-400 h-full rounded-full transition-all duration-300 ease-out";

      barWrapper.appendChild(progressBar);
      container.appendChild(labelWrapper);
      container.appendChild(barWrapper);

      this.container.appendChild(container);
    } else {
      progressBar = container.querySelector(".progress-bar") as HTMLElement;
    }

    // Update bar
    if (progressBar) progressBar.style.width = `${clampedPercent}%`;

    // Handle 100% completion
    if (clampedPercent !== 100) return this;
    setTimeout(() => {
      const barWrapper = container.querySelector(
        ".progress-bar-wrapper",
      ) as HTMLElement;
      if (barWrapper) barWrapper.style.display = "none";

      const labelWrapper = container.querySelector(".flex.items-center");
      if (labelWrapper && !labelWrapper.querySelector(".ti-check")) {
        const checkmark = document.createElement("span");
        checkmark.className =
          "ti ti-check text-green-500 dark:text-green-400 text-sm";
        labelWrapper.appendChild(checkmark);
      }
    }, 500);

    return this;
  }

  /**
   * Add button to output
   */
  button(options: ButtonOptions): this {
    const button = document.createElement("button");
    const variantClasses = {
      primary: "btn-primary",
      secondary: "btn-secondary",
      subtle: "btn-subtle",
    };

    button.className += `${variantClasses[options.variant || "primary"]}`;

    const label = document.createElement("span");
    label.className = "nowrap whitespace-nowrap";

    if (options.label) {
      label.textContent = options.label;
    }

    if (options.icon) {
      const icon = document.createElement("i");
      icon.className = options.icon;
      button.insertBefore(icon, button.firstChild);
    }

    button.disabled = options.disabled || false;

    button.onclick = () =>
      options.onClick({
        label,
        icon: options.icon ? button.querySelector("i") : null,
      });
    button.appendChild(label);

    this.container.appendChild(button);
    return this;
  }

  /**
   * Clear all content
   */
  clear(): this {
    this.container.innerHTML = "";
    return this;
  }

  /**
   * Show the output container
   */
  show(): this {
    this.container.classList.remove("hidden");
    return this;
  }

  /**
   * Hide the output container
   */
  hide(): this {
    this.container.classList.add("hidden");
    return this;
  }

  /**
   * Get the container element
   */
  getContainer(): HTMLElement {
    return this.container;
  }

  /**
   * Get text content of the output
   */
  getTextContent(): string {
    return this.container.textContent ?? "";
  }

  /**
   * Remove a specific element from output
   */
  removeElement(element: HTMLElement): this {
    if (this.container.contains(element)) {
      this.container.removeChild(element);
    }
    return this;
  }
}

// ==========================
// Helper Functions
// ==========================

/**
 * Normalize various data types to table format
 */
function normalizeToTableData(
  data: unknown,
  columns?: string[],
): {
  headers: string[];
  rows: (string | number | boolean | null)[][];
} {
  // Handle Sqlite todo

  // Handle array of objects
  if (Array.isArray(data) && data.length > 0 && typeof data[0] === "object") {
    const headers = columns || Object.keys(data[0]);
    const rows = data.map((obj) => headers.map((key) => obj[key] ?? null));
    return { headers, rows };
  }

  // Handle simple array
  if (Array.isArray(data)) {
    return {
      headers: ["(index)", "(value)"],
      rows: data.map((val, idx) => [idx, val]),
    };
  }

  // Handle object with nested objects (like console.table)
  if (typeof data === "object" && data !== null) {
    const entries = Object.entries(data);

    // Check if all values are objects
    if (
      entries.length > 0 &&
      entries.every(([_, val]) => typeof val === "object" && val !== null)
    ) {
      // Collect all unique keys from nested objects
      const allKeys = new Set<string>();
      entries.forEach(([_, obj]) => {
        if (typeof obj === "object" && obj !== null) {
          Object.keys(obj).forEach((key) => allKeys.add(key));
        }
      });

      const headers = ["(index)", ...Array.from(allKeys)];
      const rows = entries.map(([key, obj]) => {
        const row = [key];
        allKeys.forEach((prop) => {
          row.push(obj[prop] ?? null);
        });
        return row;
      });

      return { headers, rows };
    }

    // Handle regular object
    return {
      headers: ["(key)", "(value)"],
      rows: entries.map(([key, val]) => [key, val as any]),
    };
  }

  // Fallback
  return {
    headers: ["(value)"],
    rows: [[String(data)]],
  };
}
