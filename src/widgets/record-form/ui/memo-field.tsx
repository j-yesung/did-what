"use client";

import { MAX_MEMO_LENGTH } from "@/entities/record";
import { Field, FieldError } from "@/shared/ui/field";

type RecordMemoFieldProps = {
  initialMemo?: string;
  memoError?: string;
};

export function RecordMemoField({ initialMemo = "", memoError }: RecordMemoFieldProps) {
  return (
    <Field data-invalid={Boolean(memoError)}>
      <textarea
        aria-describedby={memoError ? "memo-error" : undefined}
        aria-invalid={Boolean(memoError)}
        aria-label="메모"
        className="field-sizing-content block w-full resize-none bg-transparent p-0 text-base leading-[1.7] outline-none placeholder:text-muted-foreground/60"
        defaultValue={initialMemo}
        id="memo"
        maxLength={MAX_MEMO_LENGTH}
        name="memo"
        placeholder="더 하고 싶은 이야기 있어?"
        rows={1}
      />
      <FieldError id="memo-error">{memoError}</FieldError>
    </Field>
  );
}
