import Cookies from "js-cookie";

export type ColorTheme = "light" | "dark";

/**
 * This function returns the initial theme based on the theme cookie or the system preference.
 * This only works in the browser.
 * @returns the initial theme
 */
export function getColorTheme(): ColorTheme {
  // First check for cookie
  const themeCookie = Cookies.get("theme") as ColorTheme | undefined;
  if (themeCookie) {
    return themeCookie;
  }

  // If no cookie, check for system preference
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  // Default to light mode
  return "light";
}

/**
 * This function sets the theme based on the theme cookie or the system preference by adding a class to the documentElement.
 * @param theme either "light" or "dark"
 */
export function setColorTheme(theme: ColorTheme) {
  // Set in cookie for server-side access
  Cookies.set("theme", theme, {
    path: "/",
    sameSite: "strict",
    expires: 365,
  });

  // Also store in localStorage for faster client-side access
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem('theme', theme);
  }

  document.documentElement.classList.remove("dark", "light");
  document.documentElement.classList.add(theme);
}
