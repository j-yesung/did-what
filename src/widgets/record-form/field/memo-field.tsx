"use client";

import { useState } from "react";

import { Field, FieldDescription, FieldError, FieldLabel } from "@/shared/ui/field";
import { Textarea } from "@/shared/ui/textarea";

type RecordMemoFieldProps = {
  initialMemo?: string;
  memoError?: string;
};

export function RecordMemoField({ initialMemo = "", memoError }: RecordMemoFieldProps) {
  const [memoLength, setMemoLength] = useState(initialMemo.length);

  return (
    <Field data-invalid={Boolean(memoError)}>
      <FieldLabel className="font-semibold text-base" htmlFor="memo">
        메모 <span className="font-[650] text-[11px] text-muted-foreground">(선택)</span>
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
      <div className="-mt-2 h-0">
        <FieldDescription
          className="invisible text-right tabular-nums group-focus-within/field:visible"
          id="memo-count"
        >
          {memoLength}/500
        </FieldDescription>
      </div>
      <FieldError id="memo-error">{memoError}</FieldError>
    </Field>
  );
}
