"use client";

import { useSyncExternalStore } from "react";

import { getThemeColors, type Theme } from "../model/theme";
import { getAppliedTheme } from "../model/theme-preference";

const subscribeTheme = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributeFilter: ["class"] });
  return () => observer.disconnect();
};

export function ThemeMeta({ initialTheme }: { initialTheme: Theme }) {
  const theme = useSyncExternalStore(subscribeTheme, getAppliedTheme, () => initialTheme);

  return getThemeColors(theme).map(({ color, media }) => (
    <meta content={color} key={media} media={media} name="theme-color" />
  ));
}
