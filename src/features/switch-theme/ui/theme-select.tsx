"use client";

import { useEffect, useState } from "react";

import { useActionOverride } from "@/shared/lib/action-override";
import { FieldLegend, FieldSet } from "@/shared/ui/field";
import { SegmentedControl, SegmentedControlItem } from "@/shared/ui/segmented-control";

import { parseTheme, THEME_OPTIONS, type Theme } from "../model/theme";
import { applyTheme, getAppliedTheme, saveTheme } from "../model/theme-preference";

type ThemeSelectProps = {
  value: Theme;
};

export function ThemeSelect({ value }: ThemeSelectProps) {
  const [selectedTheme, setSelectedTheme] = useState(value);
  const persistTheme = useActionOverride(saveTheme);

  useEffect(() => setSelectedTheme(value), [value]);
  useEffect(() => setSelectedTheme(getAppliedTheme()), []);

  const handleValueChange = (nextValue: string) => {
    const nextTheme = parseTheme(nextValue);
    applyTheme(nextTheme);
    persistTheme(nextTheme);
    setSelectedTheme(nextTheme);
  };

  return (
    <FieldSet className="gap-2">
      <FieldLegend>화면 모드</FieldLegend>
      <SegmentedControl name="theme" size="large" onValueChange={handleValueChange} value={selectedTheme}>
        {THEME_OPTIONS.map((option) => (
          <SegmentedControlItem key={option.value} value={option.value}>
            {option.label}
          </SegmentedControlItem>
        ))}
      </SegmentedControl>
    </FieldSet>
  );
}
