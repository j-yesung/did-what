export type Theme = "light" | "dark" | "system";

export const THEME_COOKIE = "theme";

const THEME_COLORS = { dark: "#191f28", light: "#f9fafb" };

export const getThemeColors = (theme: Theme) => [
  {
    color: theme === "dark" ? THEME_COLORS.dark : THEME_COLORS.light,
    media: "(prefers-color-scheme: light)",
  },
  {
    color: theme === "light" ? THEME_COLORS.light : THEME_COLORS.dark,
    media: "(prefers-color-scheme: dark)",
  },
];

export const THEME_OPTIONS: { label: string; value: Theme }[] = [
  { label: "시스템", value: "system" },
  { label: "라이트", value: "light" },
  { label: "다크", value: "dark" },
];

// 쿠키 값은 언제든 손댈 수 있으므로 아는 값만 통과시킨다.
export const parseTheme = (value: string | undefined): Theme => {
  return value === "light" || value === "dark" ? value : "system";
};
