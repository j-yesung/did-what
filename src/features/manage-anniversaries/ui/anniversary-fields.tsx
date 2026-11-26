import type { AnniversaryDraft } from "@/entities/anniversary/model/types";
import { cn } from "@/shared/lib/utils";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";

type AnniversaryFieldsProps = {
  draft: AnniversaryDraft;
  error: string;
  onChange: (draft: AnniversaryDraft) => void;
  style?: "night" | "date" | "line";
};

const DAYS_PER_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const MONTHS = Array.from({ length: DAYS_PER_MONTH.length }, (_, index) => index + 1);
const formatMonthDay = (month: number, day: number) =>
  `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

export function AnniversaryFields({ draft, error, onChange, style }: AnniversaryFieldsProps) {
  const isMemoLayout = style === undefined;
  const compact = style === "line";
  const dateFirst = style === "date";
  const orientation = compact ? "horizontal" : "vertical";
  const [month, day] = draft.monthDay.split("-").map(Number);
  const selectClassName = "h-11 cursor-pointer bg-transparent px-1.5 text-foreground text-sm";

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
    <Field
      className={cn("gap-1", compact && "min-h-12 border-border border-b", isMemoLayout && "gap-0")}
      orientation={orientation}
    >
      <FieldLabel
        className={cn(
          compact && "shrink-0 text-muted-foreground",
          dateFirst && "sr-only",
          isMemoLayout && "text-muted-foreground text-xs",
        )}
        htmlFor="anniversary-month"
      >
        날짜
      </FieldLabel>
      <div
        className={cn(
          "flex items-center gap-2",
          compact && "min-w-0 flex-1 justify-end",
          style === "night" && "rounded-lg bg-muted",
          dateFirst && "justify-center rounded-2xl bg-primary/10",
        )}
      >
        <select
          aria-label="월"
          className={selectClassName}
          id="anniversary-month"
          onChange={(event) => {
            const nextMonth = Number(event.target.value);
            onChange({ ...draft, monthDay: formatMonthDay(nextMonth, Math.min(day, DAYS_PER_MONTH[nextMonth - 1])) });
          }}
          value={month}
        >
          {MONTHS.map((option) => (
            <option key={option} value={option}>
              {option}월
            </option>
          ))}
        </select>
        <select
          aria-label="일"
          className={selectClassName}
          onChange={(event) => onChange({ ...draft, monthDay: formatMonthDay(month, Number(event.target.value)) })}
          value={day}
        >
          {Array.from({ length: DAYS_PER_MONTH[month - 1] }, (_, index) => index + 1).map((option) => (
            <option key={option} value={option}>
              {option}일
            </option>
          ))}
        </select>
      </div>
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
