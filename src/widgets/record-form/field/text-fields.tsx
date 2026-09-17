"use client";

import { useState } from "react";

import { Field, FieldDescription, FieldError, FieldLabel, FieldSeparator } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";

type RecordTextFieldsProps = {
  activityError?: string;
  initialActivity?: string;
  initialMemo?: string;
  memoError?: string;
};

export function RecordTextFields({
  activityError,
  initialActivity,
  initialMemo = "",
  memoError,
}: RecordTextFieldsProps) {
  const [memoLength, setMemoLength] = useState(initialMemo.length);

  return (
    <>
      <Field data-invalid={Boolean(activityError)}>
        <FieldLabel className="font-semibold text-base" htmlFor="activity">
          기록 제목
        </FieldLabel>
        <Input
          className="h-12"
          defaultValue={initialActivity}
          id="activity"
          maxLength={120}
          name="activity"
          placeholder="예: 오디세이한테 압도 당함"
          required
          aria-invalid={Boolean(activityError)}
          aria-describedby={activityError ? "activity-error" : undefined}
        />
        <FieldError id="activity-error">{activityError}</FieldError>
      </Field>

      <FieldSeparator />

      <Field data-invalid={Boolean(memoError)}>
        <FieldLabel className="font-semibold text-base" htmlFor="memo">
          무엇을 했나요? <span className="font-[650] text-[11px] text-muted-foreground">(선택)</span>
        </FieldLabel>
        <Textarea
          className="min-h-24 resize-none"
          defaultValue={initialMemo}
          id="memo"
          maxLength={500}
          name="memo"
          onChange={(event) => setMemoLength(event.currentTarget.value.length)}
          placeholder="더 남기고 싶은 이야기가 있다면 적어 주세요."
          rows={4}
          aria-invalid={Boolean(memoError)}
          aria-describedby={memoError ? "memo-count memo-error" : "memo-count"}
        />
        <FieldDescription
          className="invisible text-right tabular-nums group-focus-within/field:visible"
          id="memo-count"
        >
          {memoLength}/500
        </FieldDescription>
        <FieldError id="memo-error">{memoError}</FieldError>
      </Field>
    </>
  );
}
