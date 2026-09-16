"use client";

import { useEffect, useState, useTransition } from "react";

import { FieldLegend, FieldSet } from "@/shared/ui/field";
import { SegmentedControl, SegmentedControlItem } from "@/shared/ui/segmented-control";

import { setTheme } from "../api/update-theme";
import { THEME_OPTIONS, type Theme } from "../model/theme";

type ThemeSelectProps = {
  value: Theme;
};

export function ThemeSelect({ value }: ThemeSelectProps) {
  const [selectedTheme, setSelectedTheme] = useState(value);
  const [isPending, startTransition] = useTransition();

  useEffect(() => setSelectedTheme(value), [value]);

  const handleValueChange = (nextValue: string) => {
    const nextTheme = nextValue as Theme;
    const formData = new FormData();
    formData.set("theme", nextTheme);
    setSelectedTheme(nextTheme);
    startTransition(() => setTheme(formData));
  };

  return (
    <FieldSet className="gap-2" disabled={isPending}>
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
