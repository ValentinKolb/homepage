import { createFile, db, duplicateFile, type EditorFile } from "../../utils/db";
import { downloadFile, uploadFile } from "../../utils/lib";

const generalMenuItems = (props?: { file?: EditorFile }) => [
  {
    label: "Neue Datei",
    icon: <i class="ti ti-file-plus" />,
    onClick: () =>
      createFile({
        parentId: props?.file?.type === "folder" ? props?.file?.id : undefined,
      }),
  },
  {
    label: "Neuer Ordner",
    icon: <i class="ti ti-folder-plus" />,
    onClick: () =>
      createFile({
        parentId: props?.file?.type === "folder" ? props?.file?.id : undefined,
        name: "Neuer Ordner",
        type: "folder",
      }),
  },
  {
    label: "Datei hochladen",
    icon: <i class="ti ti-upload" />,
    onClick: () => uploadFile(),
  },
];

const fileMenuItems = ({
  file,
  focusFile,
}: {
  file: EditorFile;
  focusFile: () => void;
}) => [
  [
    {
      label: "Umbennnen",
      icon: <i class="ti ti-pencil" />,
      onClick: () => {
        db.files.update(file.id, {
          "controls.rename": true,
        });
        focusFile();
      },
    },
    {
      label: "Duplizieren",
      icon: <i class="ti ti-copy" />,
      onClick: () => duplicateFile(file.id),
    },
  ],
  [
    {
      label: "Herrunterladen",
      icon: <i class="ti ti-download" />,
      onClick: () => downloadFile(file),
    },
    {
      label: "Löschen",
      icon: <i class="ti ti-trash text-red-500" />,
      onClick: () => db.files.delete(file.id),
    },
  ],
];

const folderMenuItems = ({
  file,
  focusFile,
}: {
  file: EditorFile;
  focusFile: () => void;
}) => [
  [
    {
      label: "Umbennnen",
      icon: <i class="ti ti-pencil" />,
      onClick: () => {
        db.files.update(file.id, {
          "controls.rename": true,
        });
        focusFile();
      },
    },
  ],
  [
    {
      label: "Ordner Löschen",
      icon: <i class="ti ti-trash text-red-500" />,
      onClick: async () => {
        await db.transaction("rw", db.files, async () => {
          const recursiveFileDelte = async (parentId: number) => {
            // get all descendants
            const childIds = await db.files
              .where({ parentId: parentId })
              .primaryKeys();

            // call delete function recursively for all descendants
            await Promise.all(
              childIds.map((childId) => recursiveFileDelte(childId)),
            );

            // delete itself
            await db.files.delete(parentId);
          };

          await recursiveFileDelte(file.id);
        });
      },
    },
  ],
];

export { generalMenuItems, fileMenuItems, folderMenuItems };
