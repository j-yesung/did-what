import { CheckIcon } from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/shared/lib/utils";
import { TextButton } from "@/shared/ui/text-button";

import { setTheme } from "../model/actions";
import { THEME_OPTIONS, type Theme } from "../model/theme";

type ThemeSelectProps = {
  value: Theme;
};

export function ThemeSelect({ value }: ThemeSelectProps) {
  return (
    <form action={setTheme}>
      <fieldset>
        <legend className="mb-1 font-medium text-lg">화면 모드</legend>
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
                {selected ? <CheckIcon strokeWidth={2} aria-hidden="true" /> : null}
              </TextButton>
            );
          })}
        </div>
      </fieldset>
    </form>
  );
}
