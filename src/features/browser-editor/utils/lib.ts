import { createFile, type EditorFile } from "./db";

/**
 * This function formats a date.
 * @param timestamp - The timestamp to format.
 * @returns The formatted date.
 */
export const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);

  // if day is today only return time
  if (date.getDate() === new Date().getDate()) {
    return date.toLocaleString(undefined, {
      hour: "numeric",
      minute: "numeric",
    });
  }

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
};

/**
 * This function downloads a file.
 * @param file - The file to download.
 */
export const downloadFile = (file: EditorFile) => {
  if (file.type !== "text") {
    throw new Error("Invalid file type");
  }
  const blob = new Blob([file.content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * This function opens a file upload dialog and returns a promise that resolves with the selected file.
 * @param accept - The file type to accept. Defaults to all files.
 * @returns A promise that resolves with the selected file or null if the user cancels the dialog.
 */
export function uploadFile(accept?: string) {
  return new Promise((resolve) => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    if (accept) {
      fileInput.accept = accept;
    }
    fileInput.style.display = "none";
    document.body.appendChild(fileInput);

    fileInput.addEventListener("change", async () => {
      const files = fileInput.files;
      if (!files || files.length === 0) {
        document.body.removeChild(fileInput);
        resolve(null);
        return;
      }

      const file = files[0];
      try {
        await createFile({
          name: file.name,
          content: await file.text(),
        });
      } catch (error) {
        console.error("Fehler beim Lesen der Datei:", error);
        resolve(null);
      } finally {
        document.body.removeChild(fileInput);
      }
    });

    fileInput.addEventListener("cancel", () => {
      document.body.removeChild(fileInput);
      resolve(null);
    });

    fileInput.click();
  });
}
