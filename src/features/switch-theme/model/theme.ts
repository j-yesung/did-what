export type Theme = "light" | "dark" | "system";

export const THEME_COOKIE = "theme";

export const THEME_OPTIONS: { label: string; value: Theme }[] = [
  { label: "라이트", value: "light" },
  { label: "다크", value: "dark" },
  { label: "시스템", value: "system" },
];

// 쿠키 값은 언제든 손댈 수 있으므로 아는 값만 통과시킨다.
export const parseTheme = (value: string | undefined): Theme => {
  return value === "light" || value === "dark" ? value : "system";
};
