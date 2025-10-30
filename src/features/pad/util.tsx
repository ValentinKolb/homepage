import { OPFS } from "@/lib/client/files";
import { createLocalStore } from "@/lib/solidjs/localstorage";
import { common } from "@/lib/utils/crypto";
import { extractH1Title } from "@/lib/utils/markdown";
import { LoroDoc, VersionVector } from "loro-crdt";
import SuperJSON from "superjson";

SuperJSON.registerCustom<LoroDoc, string>(
  {
    isApplicable: (v) => v instanceof LoroDoc,
    serialize: (v) =>
      btoa(String.fromCharCode(...v.export({ mode: "snapshot" }))),
    deserialize: (v) => {
      const bytes = Uint8Array.from(atob(v), (c) => c.charCodeAt(0));
      const doc = new LoroDoc();
      doc.import(bytes);
      return doc;
    },
  },
  "LoroDoc",
);

SuperJSON.registerCustom<VersionVector, string>(
  {
    isApplicable: (v) => v instanceof VersionVector,
    serialize: (v) => btoa(String.fromCharCode(...v.encode())),
    deserialize: (v) => {
      const bytes = Uint8Array.from(atob(v), (c) => c.charCodeAt(0));
      return VersionVector.decode(bytes);
    },
  },
  "VersionVector",
);

/** Represents a markdown pad with metadata and content. */
export type MarkdownPad = {
  content: string;
  created: Date;
  updated: Date;
  title?: string;
  pinned?: boolean;
  id: string;
  lockEditing?: boolean;
  enableGutter?: boolean;
  enableCodeExecution?: boolean;
};

/**
 * This function loads an exported loro document from opfs
 * @param pad the pad for which to load the document
 */
export const loadPadDoc = async (pad: MarkdownPad) => {
  return await OPFS.read(`.pad/${await common.hash(pad.id)}.doc`);
};

/**
 * This function saves an exported loro document to opfs
 * @param pad the pad for which to save the document
 * @param doc the document to save
 */
export const savePadDoc = async (pad: MarkdownPad, doc: LoroDoc) => {
  await OPFS.write(
    `.pad/${await common.hash(pad.id)}.doc`,
    doc.export({ mode: "snapshot" }),
  );
};

/**
 * Extracts display title from pad (title field, H1 from content, or "Untitled").
 */
export const padTitle = (pad: MarkdownPad) =>
  pad.title?.toString() || extractH1Title(pad.content) || "Untitled";

/** Storage instance for pad persistence. */
export const PAD_STORAGE: Storage = window.localStorage;

/** Generates localStorage key for a pad. */
export const padStorageId = (pad: MarkdownPad | string) =>
  `pad:${typeof pad === "string" ? pad : pad.id}`;

/** Creates a reactive localStorage-synced store for a pad. */
export const createPadStore = (padId: string) =>
  createLocalStore<MarkdownPad>(
    padStorageId(padId),
    {
      content: "",
      created: new Date(),
      updated: new Date(),
      id: padId,
      lockEditing: false,
      enableGutter: false,
      enableCodeExecution: true,
    },
    PAD_STORAGE,
  );
