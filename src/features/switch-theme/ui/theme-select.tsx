"use client";

import { useRef, useSyncExternalStore } from "react";

import { useDemoOverride } from "@/shared/lib/demo-override";
import { cn } from "@/shared/lib/utils";
import { CheckIcon, type CheckIconHandle } from "@/shared/ui/animated-icons";
import { FieldLegend, FieldSet } from "@/shared/ui/field";
import { ListRow } from "@/shared/ui/list-row";

import { THEME_OPTIONS, type Theme } from "../model/theme";
import { applyTheme, getAppliedTheme, saveTheme, subscribeTheme } from "../model/theme-preference";

type ThemeSelectProps = {
  value: Theme;
};

export function ThemeSelect({ value }: ThemeSelectProps) {
  // 선택값의 출처는 html 클래스다. 서버 렌더에서만 쿠키 값을 쓴다.
  const selectedTheme = useSyncExternalStore(subscribeTheme, getAppliedTheme, () => value);
  const persistTheme = useDemoOverride(saveTheme);
  const checkRefs = useRef<Partial<Record<Theme, CheckIconHandle | null>>>({});

  const selectTheme = (nextTheme: Theme) => {
    if (nextTheme === selectedTheme) return;
    applyTheme(nextTheme);
    persistTheme(nextTheme);
    checkRefs.current[nextTheme]?.startAnimation();
  };

  return (
    <FieldSet className="gap-2">
      <FieldLegend>화면 모드</FieldLegend>
      <ul className="-mx-3 flex flex-col">
        {THEME_OPTIONS.map((option) => {
          const selected = option.value === selectedTheme;
          return (
            <li key={option.value}>
              <ListRow
                aria-pressed={selected}
                className="rounded-xl px-3 font-normal text-foreground after:rounded-xl"
                onClick={() => selectTheme(option.value)}
                right={
                  <CheckIcon
                    aria-hidden="true"
                    className={cn("flex text-primary [&_svg]:size-6! [&_svg]:stroke-[2.5]", !selected && "invisible")}
                    duration={0.7}
                    isAnimated={false}
                    ref={(handle) => {
                      checkRefs.current[option.value] = handle;
                    }}
                  />
                }
              >
                <span className="flex flex-col gap-0.5">
                  <span className={cn("text-[15px]", selected ? "font-bold" : "font-normal")}>{option.label}</span>
                  {option.value === "system" ? (
                    <span className="text-muted-foreground text-xs">기기 설정에 맞춰요</span>
                  ) : null}
                </span>
              </ListRow>
            </li>
          );
        })}
      </ul>
    </FieldSet>
  );
}
