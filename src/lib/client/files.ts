/**
 * Download content as a file
 * @param content - File content (string, Uint8Array, or ArrayBuffer)
 * @param filename - Name for the downloaded file
 * @param mimeType - MIME type of the content (default: "text/plain")
 */
export const downloadFileFromContent = (
  content: string | Uint8Array | ArrayBuffer | Blob,
  filename: string,
  mimeType: string = "text/plain",
): void => {
  const blob =
    content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

/**
 * Create a download link element
 * @param content - File content
 * @param filename - Name for the downloaded file
 * @param mimeType - MIME type (default: "text/plain")
 * @param linkText - Display text for the link
 * @param className - CSS class for styling
 * @returns HTMLAnchorElement configured for download
 */
export const createDownloadLink = (
  content: string | Uint8Array,
  filename: string,
  mimeType: string = "text/plain",
  linkText: string = "Download",
  className: string = "hover-text",
): HTMLAnchorElement => {
  const blob = new Blob([content], { type: mimeType });
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

/**
 * Show native file picker dialog for single file selection
 * @param conf - Configuration object
 * @param conf.accept - Accepted file types (e.g., ".txt,.pdf")
 * @param conf.multiple - Must be false or undefined for single file
 * @returns Promise resolving to selected File or rejecting if cancelled
 * @example
 * const file = await showFileDialog({ accept: ".pdf" });
 */
export function showFileDialog(conf: {
  accept?: string;
  multiple?: false;
}): Promise<File>;

/**
 * Show native file picker dialog for multiple file selection
 * @param conf - Configuration object
 * @param conf.accept - Accepted file types (e.g., ".txt,.pdf")
 * @param conf.multiple - Must be true for multiple files
 * @returns Promise resolving to array of Files or rejecting if cancelled
 * @example
 * const files = await showFileDialog({ accept: ".jpg,.png", multiple: true });
 */
export function showFileDialog(conf: {
  accept?: string;
  multiple: true;
}): Promise<File[]>;

/**
 * Show native file picker dialog implementation
 */
export function showFileDialog(conf?: {
  accept?: string;
  multiple?: boolean;
}): Promise<File | File[]> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.style.display = "none";

    if (conf?.accept) {
      input.accept = conf.accept;
    }

    if (conf?.multiple) {
      input.multiple = true;
    }

    input.addEventListener("change", ({ target }) => {
      const files = (target as HTMLInputElement).files;

      document.body.removeChild(input);

      if (!files || files.length === 0) {
        return reject(new Error("No file selected"));
      }

      if (conf?.multiple) {
        resolve(Array.from(files));
      } else {
        resolve(files[0]);
      }
    });

    input.addEventListener("cancel", () => {
      document.body.removeChild(input);
      reject(new Error("File dialog cancelled"));
    });

    document.body.appendChild(input);
    input.click();
  });
}

/**
 * Show native folder picker dialog
 * @param accept - Optional file filter for user-space filtering (e.g., ".csv,.txt")
 * @returns Promise resolving to array of Files (filtered if accept provided)
 */
export const showFolderDialog = (accept?: string): Promise<File[]> => {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.style.display = "none";

    // Enable directory selection
    input.webkitdirectory = true;
    input.multiple = true;

    input.addEventListener("change", (event) => {
      const target = event.target as HTMLInputElement;
      const files = target.files;

      document.body.removeChild(input);

      if (files && files.length > 0) {
        let fileArray = Array.from(files);

        // User-space filtering if accept parameter provided
        if (accept) {
          const acceptedExtensions = accept
            .split(",")
            .map((ext) => ext.trim().toLowerCase().replace(/^\*/, ""));

          fileArray = fileArray.filter((file) => {
            const fileName = file.name.toLowerCase();
            return acceptedExtensions.some((ext) => fileName.endsWith(ext));
          });

          if (fileArray.length === 0) {
            reject(new Error("No files matched the specified filter"));
            return;
          }
        }

        resolve(fileArray);
      } else {
        reject(new Error("No folder selected"));
      }
    });

    input.addEventListener("cancel", () => {
      document.body.removeChild(input);
      reject(new Error("Folder dialog cancelled"));
    });

    document.body.appendChild(input);
    input.click();
  });
};

/**
 * Parse and compress an image file to base64 string with center cropping
 * @param file - Image file to process
 * @param maxSize - Maximum width/height in pixels (creates square output, default: 512)
 * @param quality - JPEG quality 0-1 (default: 0.8)
 * @param format - Output format "image/jpeg" or "image/webp" (default: "image/webp")
 * @returns Promise resolving to base64 data URL string
 */
export const parseImage = (
  file: File,
  maxSize: number = 512,
  quality: number = 0.8,
  format: "image/jpeg" | "image/webp" | "image/png" = "image/webp",
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      reject(new Error("File is not an image"));
      return;
    }

    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Canvas context not available"));
      return;
    }

    img.onload = () => {
      const { width, height } = img;

      // Calculate crop dimensions (center crop to square)
      const cropSize = Math.min(width, height);
      const cropX = (width - cropSize) / 2;
      const cropY = (height - cropSize) / 2;

      // Set canvas to square output size
      canvas.width = maxSize;
      canvas.height = maxSize;

      // Draw cropped and scaled image
      ctx.drawImage(
        img,
        cropX,
        cropY,
        cropSize,
        cropSize, // Source (crop from center)
        0,
        0,
        maxSize,
        maxSize, // Destination (scale to maxSize)
      );

      // Convert to base64
      try {
        const base64 = canvas.toDataURL(format, quality);
        resolve(base64);
      } catch (error) {
        reject(new Error(`Failed to convert image: ${error}`));
      }
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    // Load image from file
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Build safe file paths from template literals with hash for uniqueness
 * @param strings - Template literal strings
 * @param values - Interpolated values
 * @returns Safe file path with cleaned prefix and non cryptographic hash suffix
 * @example
 * const filePath = path`uploads/${userName}/${fileName}.txt`;
 * // "uploads/john-doe-a3f2b1/my-file-c8d4e9.txt"
 */
export const path = (
  strings: TemplateStringsArray,
  ...values: unknown[]
): string => {
  const sanitize = (segment: string): string => {
    const cleaned = segment
      .toString()
      .replace(/[^\w.-]/g, "-")
      .replace(/^\.+/, "")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase()
      .slice(0, 20); // Limit length for readability

    // Create hash synchronously using a simple hash function
    let hashValue = 0;
    for (let i = 0; i < segment.length; i++) {
      hashValue = (hashValue << 5) - hashValue + segment.charCodeAt(i);
      hashValue = hashValue & hashValue;
    }
    const shortHash = Math.abs(hashValue).toString(36).slice(0, 6);

    return cleaned ? `${cleaned}-${shortHash}` : shortHash;
  };

  let result = "";
  strings.forEach((str, i) => {
    result += str;
    if (i < values.length) {
      const value = values[i];
      result += String(value)
        .split("/")
        .map(sanitize)
        .filter(Boolean)
        .join("/");
    }
  });

  return result
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join("/");
};

/**
 * OPFS wrapper with subfolder support
 */
export const OPFS = {
  /**
   * Navigate (recursively) to directory by path segments.
   * @see documentation https://developer.mozilla.org/en-US/docs/Web/API/FileSystemDirectoryHandle/getDirectoryHandle
   */
  getDirHandle: async (
    segments: string[],
    create: boolean = false,
  ): Promise<FileSystemDirectoryHandle> => {
    let dir = await navigator.storage.getDirectory();

    for (const segment of segments) {
      dir = await dir.getDirectoryHandle(segment, { create });
    }

    return dir;
  },

  /**
   * Delete file or directory recursively
   */
  delete: async (name: string): Promise<void> => {
    const segments = name.split("/").filter(Boolean);
    if (segments.length === 0) return;

    const fileName = segments.pop()!;
    const dir = await OPFS.getDirHandle(segments);

    await dir.removeEntry(fileName, { recursive: true });
  },

  /**
   * Write file (creates subdirectories if needed)
   */
  write: async (name: string, data: string | Uint8Array): Promise<void> => {
    const segments = name.split("/").filter(Boolean);
    const fileName = segments.pop()!;
    const dir = await OPFS.getDirHandle(segments, true);

    const fileHandle = await dir.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(data);
    await writable.close();
  },

  /**
   * Read file from path
   */
  read: async (name: string): Promise<Uint8Array | undefined> => {
    try {
      const segments = name.split("/").filter(Boolean);
      const fileName = segments.pop()!;
      const dir = await OPFS.getDirHandle(segments);

      const fileHandle = await dir.getFileHandle(fileName);
      const file = await fileHandle.getFile();
      const buffer = await file.arrayBuffer();
      return new Uint8Array(buffer);
    } catch {
      return undefined;
    }
  },

  /**
   * List directory contents
   */
  ls: async (dirPath: string = ""): Promise<string[]> => {
    try {
      const segments = dirPath.split("/").filter(Boolean);
      const dir = await OPFS.getDirHandle(segments);

      const entries: string[] = [];
      for await (const entry of dir.values()) {
        entries.push(entry.name + (entry.kind === "directory" ? "/" : ""));
      }
      return entries.sort();
    } catch {
      return [];
    }
  },
};
