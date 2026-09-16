"use client";

import { useState } from "react";

import { DateInput } from "@/shared/ui/date-input";
import { Field, FieldError, FieldLabel } from "@/shared/ui/field";

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

  return (
    <div aria-labelledby="record-date-label" role="group">
      <p className="mb-1.5 font-medium text-sm" id="record-date-label">
        언제
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Field className="min-w-0" data-invalid={Boolean(recordedAtError)}>
          <FieldLabel htmlFor="record-start-date">시작일</FieldLabel>
          <DateInput
            aria-describedby={recordedAtError ? "record-start-date-error" : undefined}
            aria-invalid={Boolean(recordedAtError)}
            id="record-start-date"
            name="recordedAt"
            onChange={(event) => {
              const value = event.target.value;
              const nextRecordedUntil = !recordedUntil || recordedUntil < value ? value : recordedUntil;
              setRecordedAt(value);
              setRecordedUntil(nextRecordedUntil);
              onValueChange?.(value, nextRecordedUntil);
            }}
            required
            value={recordedAt}
          />
          <FieldError id="record-start-date-error">{recordedAtError}</FieldError>
        </Field>
        <Field className="min-w-0" data-invalid={Boolean(recordedUntilError)}>
          <FieldLabel htmlFor="record-end-date">종료일</FieldLabel>
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
      </div>
    </div>
  );
}
