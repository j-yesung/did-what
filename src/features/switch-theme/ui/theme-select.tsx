"use client";

import { useSyncExternalStore } from "react";

import { useDemoOverride } from "@/shared/lib/demo-override";
import { FieldLegend, FieldSet } from "@/shared/ui/field";
import { SegmentedControl, SegmentedControlItem } from "@/shared/ui/segmented-control";

import { parseTheme, THEME_OPTIONS, type Theme } from "../model/theme";
import { applyTheme, getAppliedTheme, saveTheme, subscribeTheme } from "../model/theme-preference";

type ThemeSelectProps = {
  value: Theme;
};

export function ThemeSelect({ value }: ThemeSelectProps) {
  // 선택값의 출처는 html 클래스다. 서버 렌더에서만 쿠키 값을 쓴다.
  const selectedTheme = useSyncExternalStore(subscribeTheme, getAppliedTheme, () => value);
  const persistTheme = useDemoOverride(saveTheme);

  const handleValueChange = (nextValue: string) => {
    const nextTheme = parseTheme(nextValue);
    applyTheme(nextTheme);
    persistTheme(nextTheme);
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
