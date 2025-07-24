export const downloadFileFromUrl = async (url: string, filename: string) => {
  const response = await fetch(url);
  const blob = await response.blob();
  const urlCreator = window.URL || window.webkitURL;
  const downloadUrl = urlCreator.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadFileFromContent = (
  content: string | Uint8Array | ArrayBuffer,
  filename: string,
  mimeType: string = "text/plain",
) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

export const createDownloadLink = (
  content: string | Uint8Array,
  filename: string,
  mimeType: string = "text/plain",
  linkText: string = "Download",
  className: string = "hover-text",
): HTMLAnchorElement => {
  const blob = new Blob([content], { type: mimeType }); // todo muss ich hier was anpassen wegen Uint8Array?
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.textContent = linkText;
  link.className = className;

  link.addEventListener("click", () => {
    // Clean up the URL after download
    setTimeout(() => URL.revokeObjectURL(url), 100);
  });

  return link;
};

export const showFileDialog = (
  title: string,
  accept?: string,
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    if (accept) {
      input.accept = accept;
    }
    input.title = title;

    let hasResolved = false;

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && !hasResolved) {
        hasResolved = true;
        resolve(file);
      }
    };

    // Handle cancel with a delay to avoid immediate triggering
    const handleCancel = () => {
      setTimeout(() => {
        if (!hasResolved) {
          hasResolved = true;
          reject(new Error("No file selected"));
        }
      }, 200); // Small delay to let file selection complete
    };

    // Use focus events to detect cancel
    window.addEventListener("focus", handleCancel, { once: true });

    // Fallback timeout
    setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        reject(new Error("No file selected"));
      }
    }, 60000);

    input.click();
  });
};
