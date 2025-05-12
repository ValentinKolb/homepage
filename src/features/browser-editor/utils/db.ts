import useQueryParam from "@/lib/solidjs/search-params";
import Dexie, { type EntityTable } from "dexie";
import { createEffect, createSignal } from "solid-js";

type IFile = {
  id: number;
  name: string;
  timestamp: number;
  parentId?: number;
  controls: {
    opened?: number;
    rename: boolean;
  };
};

type ITextFile = IFile & { type: "text"; content: string };
type IFolder = IFile & { type: "folder" };

type EditorFile = ITextFile | IFolder;

const db = new Dexie("BrowserEditor") as Dexie & {
  files: EntityTable<EditorFile, "id">;
};

db.version(1).stores({
  files:
    "++id, name, timestamp, parentId, controls.opened, controls.rename, type",
});

/**
 * Creates a new file, tries to guess the file type from the file extension (if a name was provided)
 * also sets resunable defaults (timestamp, ...)
 */
const createFile = async (props?: Partial<EditorFile>) => {
  const type = props?.type || "text";
  return await db.files.add({
    name: "Neue Datei",
    type,
    timestamp: Date.now(),
    ...props,
    controls: {
      opened: Date.now(),
      rename: false,
      ...props?.controls,
    },
  });
};

const duplicateFile = async (fileId: number) => {
  const file = await db.files.get(fileId);
  if (!file) return null;

  return await db.files.add({
    ...file,
    name: `${file.name} (Kopie)`,
    timestamp: Date.now(),
    controls: {
      ...file.controls,
      opened: Date.now(),
    },
  });
};

const OPEN_FILE = "f";
const useOpenFileQueryParam = () => useQueryParam(OPEN_FILE, Number);

/**
 * hook to open a file and set it as the current file. the open timestamp is only updated when the file is not already open
 * also lets you close the file
 */
const useOpenedFile = () => {
  const [openFileId, setOpenFileId] = useOpenFileQueryParam();
  const [openFile, _setOpenFile] = createSignal<EditorFile | undefined>();

  const handler = async (
    file_or_fileId: number | EditorFile,
    close = false,
  ) => {
    let file: EditorFile | undefined;
    if (typeof file_or_fileId === "number") {
      file = await db.files.get(file_or_fileId);
    } else {
      file = file_or_fileId;
    }

    if (!file) return;

    // case close file
    if (close) {
      await db.files.update(file.id, { "controls.opened": 0 });
      setOpenFileId(null);
      _setOpenFile(undefined);
      return;
    }

    // case open file
    if (file.id === openFile()?.id) return; // only open if not already open
    document.title = file.name;
    setOpenFileId(file.id);
    _setOpenFile(file);
    if ((file.controls.opened ?? 0) > 0) return;
    await db.files.update(file.id, {
      "controls.opened": Date.now(),
      timestamp: Date.now(),
    });
  };

  const deselectFile = async () => {
    setOpenFileId(null);
    _setOpenFile(undefined);
  };

  // react when openFileId changes
  createEffect(() => {
    const id = openFileId();
    if (id) openFileHandler(id);
  });

  // concrete implementation of handlers
  const openFileHandler = (file_or_fileId: number | EditorFile) =>
    handler(file_or_fileId);
  const closeFileHandler = (file_or_fileId: number | EditorFile) =>
    handler(file_or_fileId, true);
  const closeCurrentFile = async () => {
    const currentFile = openFile();
    if (!currentFile) return;
    await closeFileHandler(currentFile);
  };

  return {
    openFile,
    openFileHandler,
    closeFileHandler,
    closeCurrentFile,
    deselectFile,
  };
};

export {
  db,
  duplicateFile,
  createFile,
  useOpenedFile,
  type EditorFile,
  type ITextFile,
  type IFolder,
};
