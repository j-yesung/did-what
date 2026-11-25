import type { Anniversary } from "@/entities/anniversary/model/types";
import { cn } from "@/shared/lib/utils";
import { DateInput } from "@/shared/ui/date-input";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";

type AnniversaryFieldsProps = {
  draft: Anniversary;
  error: string;
  onChange: (draft: Anniversary) => void;
  style?: "night" | "date" | "line";
};

export function AnniversaryFields({ draft, error, onChange, style }: AnniversaryFieldsProps) {
  const isMemoLayout = style === undefined;
  const compact = style === "line";
  const dateFirst = style === "date";
  const orientation = compact ? "horizontal" : "vertical";

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
        htmlFor="anniversary-date"
      >
        날짜
      </FieldLabel>
      <DateInput
        className={cn(
          "h-11 border-0",
          isMemoLayout ? "[&>span]:px-0" : "focus-within:ring-2 focus-within:ring-ring/50",
          compact && "min-w-0 flex-1 [&>span]:justify-end [&>span]:px-0",
          style === "night" && "bg-muted",
          dateFirst &&
            "h-16 rounded-2xl bg-primary/10 text-accent-text [&>span]:justify-center [&>span]:font-extrabold [&>span]:text-xl",
        )}
        id="anniversary-date"
        min="0001-01-01"
        max="9999-12-31"
        onChange={(event) => onChange({ ...draft, date: event.target.value })}
        required
        value={draft.date}
      />
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
