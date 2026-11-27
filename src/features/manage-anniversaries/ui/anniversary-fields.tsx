import type { AnniversaryDraft } from "@/entities/anniversary/model/types";
import { cn } from "@/shared/lib/utils";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { WheelPicker, WheelPickerGroup } from "@/shared/ui/wheel-picker";

type AnniversaryFieldsProps = {
  draft: AnniversaryDraft;
  error: string;
  onChange: (draft: AnniversaryDraft) => void;
  style?: "night" | "date" | "line";
};

const DAYS_PER_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const MONTH_OPTIONS = DAYS_PER_MONTH.map((_, index) => ({ label: `${index + 1}월`, value: index + 1 }));
const formatMonthDay = (month: number, day: number) =>
  `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

export function AnniversaryFields({ draft, error, onChange, style }: AnniversaryFieldsProps) {
  const isMemoLayout = style === undefined;
  const compact = style === "line";
  const dateFirst = style === "date";
  const orientation = compact ? "horizontal" : "vertical";
  const [month, day] = draft.monthDay.split("-").map(Number);

  const nameField = (
    <Field
      className={cn("gap-1", compact && "min-h-12 border-border border-b", isMemoLayout && "gap-0")}
      orientation={orientation}
    >
      <FieldLabel
        className={cn(
          compact && "shrink-0 text-muted-foreground",
          style === "night" && "sr-only",
          isMemoLayout && "text-muted-foreground text-xs",
        )}
        htmlFor="anniversary-name"
      >
        기념일 이름
      </FieldLabel>
      <Input
        className={cn(
          "h-11",
          compact && "border-0 text-right",
          style === "night" && "h-14 font-bold text-2xl tracking-[-0.04em] md:text-2xl",
          isMemoLayout && "h-12 border-0 font-bold text-2xl tracking-[-0.04em] md:text-2xl",
        )}
        containerClassName={compact ? "min-w-0 flex-1" : undefined}
        id="anniversary-name"
        onChange={(event) => onChange({ ...draft, name: event.target.value })}
        placeholder="예: 크리스마스"
        required
        value={draft.name}
        variant="underline"
      />
    </Field>
  );

  const dateField = (
    <Field className={cn("gap-1", isMemoLayout && "gap-0")}>
      <FieldLabel className={cn(dateFirst && "sr-only", (compact || isMemoLayout) && "text-muted-foreground text-xs")}>
        날짜
      </FieldLabel>
      <WheelPickerGroup aria-label="기념일 날짜">
        <WheelPicker
          aria-label="월"
          infinite
          onValueChange={(nextMonth) =>
            onChange({ ...draft, monthDay: formatMonthDay(nextMonth, Math.min(day, DAYS_PER_MONTH[nextMonth - 1])) })
          }
          options={MONTH_OPTIONS}
          value={month}
        />
        <WheelPicker
          aria-label="일"
          infinite
          onValueChange={(nextDay) => onChange({ ...draft, monthDay: formatMonthDay(month, nextDay) })}
          options={Array.from({ length: DAYS_PER_MONTH[month - 1] }, (_, index) => ({
            label: `${index + 1}일`,
            value: index + 1,
          }))}
          value={day}
        />
      </WheelPickerGroup>
    </Field>
  );

  return (
    <FieldGroup className={cn("gap-4", compact && "gap-2", isMemoLayout && "gap-3")}>
      {dateFirst ? (
        <>
          {dateField}
          {nameField}
        </>
      ) : (
        <>
          {nameField}
          {dateField}
        </>
      )}
      <FieldError>{error}</FieldError>
    </FieldGroup>
  );
}
