import { cn } from "@/shared/lib/utils";
import { Checkbox } from "@/shared/ui/checkbox";
import { FieldLegend, FieldSet } from "@/shared/ui/field";
import { TextButton } from "@/shared/ui/text-button";

import { setTheme } from "../api/update-theme";
import { THEME_OPTIONS, type Theme } from "../model/theme";

type ThemeSelectProps = {
  value: Theme;
};

export function ThemeSelect({ value }: ThemeSelectProps) {
  return (
    <form action={setTheme}>
      <FieldSet className="gap-0">
        <FieldLegend>화면 모드</FieldLegend>
        <div className="flex flex-col">
          {THEME_OPTIONS.map((option) => {
            const selected = option.value === value;

            return (
              <TextButton
                aria-pressed={selected}
                className={cn("min-h-11 w-full justify-between", selected && "font-[650]")}
                key={option.value}
                name="theme"
                tone={selected ? "default" : "muted"}
                type="submit"
                value={option.value}
              >
                {option.label}
                <Checkbox
                  aria-hidden="true"
                  checked={selected}
                  className="pointer-events-none"
                  readOnly
                  tabIndex={-1}
                  variant="check"
                />
              </TextButton>
            );
          })}
        </div>
      </FieldSet>
    </form>
  );
}
