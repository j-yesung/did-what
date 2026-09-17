"use client";

import { useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { DateInput } from "@/shared/ui/date-input";
import { Field, FieldError, FieldLabel } from "@/shared/ui/field";
import { Switch } from "@/shared/ui/switch";

const DATE_FIELD_TRANSITION = { duration: 0.2, ease: [0.23, 1, 0.32, 1] as const };

type RecordDateFieldProps = {
  defaultRecordedAt: string;
  initialRecordedAt?: string;
  initialRecordedUntil?: string | null;
  onValueChange?: (recordedAt: string, recordedUntil: string) => void;
  recordedAtError?: string;
  recordedUntilError?: string;
};

export function RecordDateField({
  defaultRecordedAt,
  initialRecordedAt,
  initialRecordedUntil,
  onValueChange,
  recordedAtError,
  recordedUntilError,
}: RecordDateFieldProps) {
  const [recordedAt, setRecordedAt] = useState(initialRecordedAt ?? defaultRecordedAt);
  const [recordedUntil, setRecordedUntil] = useState(initialRecordedUntil ?? initialRecordedAt ?? defaultRecordedAt);
  const [isSingleDay, setIsSingleDay] = useState(
    (initialRecordedUntil ?? initialRecordedAt ?? defaultRecordedAt) === recordedAt,
  );
  const shouldReduceMotion = useReducedMotion();
  const transition = shouldReduceMotion ? { duration: 0 } : DATE_FIELD_TRANSITION;

  const handleSingleDayChange = (checked: boolean) => {
    setIsSingleDay(checked);
    if (!checked) return;

    setRecordedUntil(recordedAt);
    onValueChange?.(recordedAt, recordedAt);
  };

  return (
    <div aria-labelledby="record-date-label" role="group">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="font-semibold text-base" id="record-date-label">
          언제
        </p>
        <label
          className="flex cursor-pointer items-center gap-2 text-muted-foreground text-sm"
          htmlFor="record-single-day"
        >
          하루 기록
          <Switch checked={isSingleDay} id="record-single-day" onCheckedChange={handleSingleDayChange} />
        </label>
      </div>
      <motion.div
        className={isSingleDay ? "grid grid-cols-1 gap-3" : "grid grid-cols-2 gap-3"}
        layout
        transition={transition}
      >
        <Field className="min-w-0" data-invalid={Boolean(recordedAtError)}>
          <FieldLabel className="text-muted-foreground" htmlFor="record-start-date">
            {isSingleDay ? "기록한 날" : "첫날"}
          </FieldLabel>
          <DateInput
            aria-describedby={recordedAtError ? "record-start-date-error" : undefined}
            aria-invalid={Boolean(recordedAtError)}
            id="record-start-date"
            name="recordedAt"
            onChange={(event) => {
              const value = event.target.value;
              const nextRecordedUntil = isSingleDay || !recordedUntil || recordedUntil < value ? value : recordedUntil;
              setRecordedAt(value);
              setRecordedUntil(nextRecordedUntil);
              onValueChange?.(value, nextRecordedUntil);
            }}
            required
            value={recordedAt}
          />
          <FieldError id="record-start-date-error">{recordedAtError}</FieldError>
        </Field>
        <AnimatePresence initial={false} mode="popLayout">
          {!isSingleDay ? (
            <motion.div
              animate={{ opacity: 1, transform: "translateX(0)" }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, transform: "translateX(8px)" }}
              initial={shouldReduceMotion ? false : { opacity: 0, transform: "translateX(8px)" }}
              transition={transition}
            >
              <Field className="min-w-0" data-invalid={Boolean(recordedUntilError)}>
                <FieldLabel className="text-muted-foreground" htmlFor="record-end-date">
                  마지막 날
                </FieldLabel>
                <DateInput
                  aria-describedby={recordedUntilError ? "record-end-date-error" : undefined}
                  aria-invalid={Boolean(recordedUntilError)}
                  id="record-end-date"
                  min={recordedAt || undefined}
                  name="recordedUntil"
                  onChange={(event) => {
                    const value = event.target.value;
                    setRecordedUntil(value);
                    onValueChange?.(recordedAt, value);
                  }}
                  value={recordedUntil}
                />
                <FieldError id="record-end-date-error">{recordedUntilError}</FieldError>
              </Field>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
