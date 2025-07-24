import { getColorTheme, onThemeChange } from "@/lib/client/color-theme";
import { createLocalStore } from "@/lib/solidjs/localstorage";
import { extractH1Title } from "@/lib/utils/markdown-util";
import { createSignal } from "solid-js";
import SuperJSON from "superjson";
import { LoroDoc, VersionVector } from "loro-crdt";
import { getTextFromDoc } from "loro-codemirror";
import { getRandomName } from "@/lib/client/random";
import { nanoid } from "nanoid";

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
  doc?: LoroDoc;
  created: Date;
  updated: Date;
  title?: string;
  pinned?: boolean;
  collab?: boolean;
  id: string;
};

export type MarkdownPadSettings = {
  name: string;
  publicUserId: string;
};

/**
 * Creates a reactive theme signal that automatically updates when system theme changes.
 */
export const createTheme = () => {
  const [theme, setTheme] = createSignal(getColorTheme());

  // Listen for theme changes
  onThemeChange((newTheme) => {
    setTheme(newTheme);
  });

  return theme;
};

export const getDocFromPad = (pad: MarkdownPad) => {
  if (pad.doc) return pad.doc;

  const d = new LoroDoc();
  getTextFromDoc(d).insert(0, pad.content);
  return d;
};

/**
 * Extracts display title from pad (title field, H1 from content, or "Untitled").
 */
export const padTitle = (pad: MarkdownPad) =>
  pad.title || extractH1Title(pad.content) || "Untitled";

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
    },
    PAD_STORAGE,
  );

export const createPadSettings = () =>
  createLocalStore<MarkdownPadSettings>(
    "pad:settings",
    {
      name: getRandomName(),
      publicUserId: nanoid(64),
    },
    PAD_STORAGE,
  );
