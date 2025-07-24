import Cookies from "js-cookie";
import superjson from "superjson";

export type ColorTheme = "light" | "dark";

// Custom Event für Theme Changes
const THEME_CHANGE_EVENT = "theme-change";

/**
 * This function returns the initial theme based on the theme cookie or the system preference.
 * This only works in the browser.
 * @returns the initial theme
 */
export const getColorTheme = (): ColorTheme => {
  // First check for cookie
  const themeCookie = Cookies.get("theme") as ColorTheme | undefined;
  if (themeCookie) {
    return themeCookie;
  }

  // Check local storage
  const themeLocalStorage = localStorage.getItem("theme");
  if (themeLocalStorage) {
    try {
      const parsed = superjson.parse(themeLocalStorage) as ColorTheme;
      return parsed;
    } catch {
      localStorage.removeItem("theme");
    }
  }

  // Check for system preference
  if (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }

  // Default to light mode
  return "light";
};

/**
 * Apply theme to the DOM without saving to storage
 * @param theme The theme to apply
 */
export const applyTheme = (theme: ColorTheme) => {
  if (typeof document !== "undefined") {
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(theme);
  }
};

/**
 * Register a callback for theme changes (works across tabs)
 * @param callback Function to call when theme changes
 */
export const onThemeChange = (callback: (theme: ColorTheme) => void) => {
  if (typeof window !== "undefined") {
    // Listen for custom events (same tab)
    window.addEventListener(THEME_CHANGE_EVENT, (event) => {
      const newTheme = (event as CustomEvent).detail as ColorTheme;
      callback(newTheme);
    });

    // Listen for storage events (cross-tab)
    window.addEventListener("storage", (event) => {
      if (event.key === "theme" && event.newValue) {
        try {
          const newTheme = superjson.parse(event.newValue) as ColorTheme;
          applyTheme(newTheme); // Auto-apply theme from other tabs
          callback(newTheme);
        } catch {
          // Fallback if parsing fails
          if (event.newValue === "light" || event.newValue === "dark") {
            const theme = event.newValue as ColorTheme;
            applyTheme(theme); // Auto-apply theme from other tabs
            callback(theme);
          }
        }
      }
    });
  }
};

/**
 * This function sets the theme based on the theme cookie or the system preference by adding a class to the documentElement.
 * @param theme either "light" or "dark"
 */
export const setColorTheme = (theme: ColorTheme) => {
  // Set in cookie for server-side access
  Cookies.set("theme", theme, {
    path: "/",
    sameSite: "strict",
    expires: 365,
  });

  // Also store in localStorage for faster client-side access
  if (typeof window !== "undefined" && window.localStorage) {
    localStorage.setItem("theme", superjson.stringify(theme));
    window.dispatchEvent(
      new CustomEvent(THEME_CHANGE_EVENT, {
        detail: theme, // Korrigiert: direkt das theme, nicht als Objekt
      }),
    );
  }

  // Apply theme to DOM
  applyTheme(theme);
};

export { THEME_CHANGE_EVENT };
