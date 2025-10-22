import { createSignal } from "solid-js";
import { getColorTheme, onThemeChange } from "../client/color-theme";

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
