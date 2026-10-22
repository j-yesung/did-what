import { THEME_COOKIE, type Theme } from "./theme.ts";

const ONE_YEAR = 60 * 60 * 24 * 365;

export const getAppliedTheme = (): Theme => {
  const root = document.documentElement;
  if (root.classList.contains("dark")) return "dark";
  if (root.classList.contains("light")) return "light";
  return "system";
};

export const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  if (theme !== "system") root.classList.add(theme);
};

export const saveTheme = (theme: Theme) => {
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
};
