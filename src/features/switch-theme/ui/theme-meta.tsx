"use client";

import { useSyncExternalStore } from "react";

import { getThemeColors, type Theme } from "../model/theme";
import { getAppliedTheme, subscribeTheme } from "../model/theme-preference";

export function ThemeMeta({ initialTheme }: { initialTheme: Theme }) {
  const theme = useSyncExternalStore(subscribeTheme, getAppliedTheme, () => initialTheme);

  return getThemeColors(theme).map(({ color, media }) => (
    <meta content={color} key={media} media={media} name="theme-color" />
  ));
}
