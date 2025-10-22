import { tags as t } from "@lezer/highlight";
import { createTheme, type CreateThemeOptions } from "@uiw/codemirror-themes";
import { EditorView } from "@codemirror/view";

// Deine Custom Theme Overrides als Styles
const customThemeOverrides: CreateThemeOptions["styles"] = [
  {
    tag: t.content,
    class: "custom-editor-overrides",
  },
];

// Custom CSS für deine Overrides
const customEditorCSS = EditorView.theme({
  "&": {
    overflow: "hidden",
    flex: 1,
    fontSize: "14px",
    fontFamily: "var(--font-mono) !important",
  },
  ".cm-line": {
    fontFamily: "var(--font-mono) !important",
    cursor: "text",
    maxWidth: "100%",
    overflow: "hidden",
    padding: "0",
  },
  "&.cm-editor.cm-focused": {
    outline: "none",
  },
  ".dark &.cm-editor.cm-focused": {
    outline: "none",
  },
  ".cm-scroller": {
    overflow: "auto",
    width: "90ch",
    maxWidth: "100%",
    margin: "0 auto",
    padding: "1rem",
  },
  ".cm-content": {
    maxWidth: "100%",
    overflowX: "hidden",
  },
  ".cm-gutters": {
    backgroundColor: "transparent",
    border: "none",
  },
  ".cm-gutterElement": {
    color: "var(--color-gray-500)",
    fontFamily: "var(--font-mono) !important",
  },
  ".cm-foldPlaceholder": {
    backgroundColor: "transparent",
    border: "none",
  },
  "&:not(.cm-focused) .cm-activeLine": {
    backgroundColor: "transparent",
  },
  "&:not(.cm-focused) .cm-activeLineGutter": {
    backgroundColor: "transparent",
  },
  ".cm-cursor, .loro-cursor": {
    borderLeftWidth: "2px",
  },
  ".loro-cursor::before": {
    background: "oklch(92.8% 0.006 264.531)",
    borderRadius: "var(--radius-md)",
  },
  ".cm-cursor-primary": {
    borderLeftWidth: "2px",
    borderLeftColor: "oklch(62.3% 0.214 259.815)",
  },
});

// Light Theme Settings
export const defaultSettingsCustomLight: CreateThemeOptions["settings"] = {
  background: "#fff",
  foreground: "#24292e",
  selection: "#BBDFFF",
  selectionMatch: "#BBDFFF",
  gutterBackground: "#fff",
  gutterForeground: "#6e7781",
};

// Light Theme Styles
export const customLightStyle: CreateThemeOptions["styles"] = [
  { tag: [t.standard(t.tagName), t.tagName], color: "#116329" },
  { tag: [t.comment, t.bracket], color: "#6a737d" },
  { tag: [t.className, t.propertyName], color: "#6f42c1" },
  {
    tag: [t.variableName, t.attributeName, t.number, t.operator],
    color: "#005cc5",
  },
  {
    tag: [t.keyword, t.typeName, t.typeOperator, t.typeName],
    color: "#d73a49",
  },
  { tag: [t.string, t.regexp], color: "#032f62" },
  { tag: [t.name, t.quote], color: "#22863a" },
  { tag: [t.strong], color: "#24292e", fontWeight: "700" },
  { tag: [t.emphasis], color: "#24292e", fontStyle: "italic" },
  { tag: [t.deleted], color: "#b31d28", backgroundColor: "#ffeef0" },
  { tag: [t.atom, t.bool, t.special(t.variableName)], color: "#e36209" },
  { tag: [t.url, t.escape, t.regexp, t.link], color: "#032f62" },

  { tag: t.strikethrough, textDecoration: "line-through" },
  { tag: t.invalid, color: "#cb2431" },
  { tag: t.heading1, color: "#24292e", fontSize: "2em", fontWeight: "800" },
  { tag: t.heading2, color: "#24292e", fontSize: "1.75em", fontWeight: "700" },
  { tag: t.heading3, color: "#24292e", fontSize: "1.5em", fontWeight: "700" },
  { tag: t.heading4, color: "#24292e", fontSize: "1.25em", fontWeight: "700" },
  { tag: t.heading5, color: "#24292e", fontSize: "1.15em", fontWeight: "700" },
  { tag: t.heading6, color: "#24292e", fontSize: "1.05em", fontWeight: "700" },
  { tag: t.meta, color: "var(--color-gray-400)" },

  ...customThemeOverrides,
];

export const customLightInit = (options?: Partial<CreateThemeOptions>) => {
  const { theme = "light", settings = {}, styles = [] } = options || {};
  return [
    createTheme({
      theme: theme,
      settings: {
        ...defaultSettingsCustomLight,
        ...settings,
      },
      styles: [...customLightStyle, ...styles],
    }),
    customEditorCSS,
  ];
};

export const customLight = customLightInit();

// Dark Theme Settings (ohne background)
export const defaultSettingsCustomDark: CreateThemeOptions["settings"] = {
  foreground: "#c9d1d9",
  caret: "#c9d1d9",
  selection: "#003d73",
  selectionMatch: "#003d73",
  lineHighlight: "#36334280",
};

// Dark Theme Styles
export const customDarkStyle: CreateThemeOptions["styles"] = [
  { tag: [t.standard(t.tagName), t.tagName], color: "#7ee787" },
  { tag: [t.comment, t.bracket], color: "#8b949e" },
  { tag: [t.className, t.propertyName], color: "#d2a8ff" },
  {
    tag: [t.variableName, t.attributeName, t.number, t.operator],
    color: "#79c0ff",
  },
  {
    tag: [t.keyword, t.typeName, t.typeOperator, t.typeName],
    color: "#ff7b72",
  },
  { tag: [t.string, t.regexp], color: "#a5d6ff" },
  { tag: [t.name, t.quote], color: "#7ee787" },
  { tag: [t.heading, t.strong], color: "#d2a8ff", fontWeight: "bold" },
  { tag: [t.emphasis], color: "#d2a8ff", fontStyle: "italic" },
  { tag: [t.deleted], color: "#ffdcd7", backgroundColor: "#ffeef0" },
  { tag: [t.atom, t.bool, t.special(t.variableName)], color: "#ffab70" },
  { tag: t.link, textDecoration: "underline" },
  { tag: t.strikethrough, textDecoration: "line-through" },
  { tag: t.invalid, color: "#f97583" },
  { tag: t.heading1, color: "#d2a8ff", fontSize: "2em", fontWeight: 800 },
  { tag: t.heading2, color: "#d2a8ff", fontSize: "1.75em", fontWeight: 700 },
  { tag: t.heading3, color: "#d2a8ff", fontSize: "1.5em", fontWeight: 700 },
  { tag: t.heading4, color: "#d2a8ff", fontSize: "1.25em", fontWeight: 700 },
  { tag: t.heading5, color: "#d2a8ff", fontSize: "1.15em", fontWeight: 700 },
  { tag: t.heading6, color: "#d2a8ff", fontSize: "1.1em", fontWeight: 700 },
  { tag: t.meta, color: "var(--color-gray-500)" },

  ...customThemeOverrides,
];

export const customDarkInit = (options?: Partial<CreateThemeOptions>) => {
  const { theme = "dark", settings = {}, styles = [] } = options || {};
  return [
    createTheme({
      theme: theme,
      settings: {
        ...defaultSettingsCustomDark,
        ...settings,
      },
      styles: [...customDarkStyle, ...styles],
    }),
    customEditorCSS,
  ];
};

export const customDark = customDarkInit();
