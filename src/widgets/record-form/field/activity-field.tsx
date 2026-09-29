"use client";

import { Field, FieldError, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";

type RecordActivityFieldProps = {
  activityError?: string;
  initialActivity?: string;
};

export function RecordActivityField({ activityError, initialActivity }: RecordActivityFieldProps) {
  return (
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
        // 한 줄 제목에서 Return은 저장이 아니라 메모로 넘어가는 뜻이다. 한글 조합 중 Enter는 글자 확정이라 건드리지 않는다.
        enterKeyHint="next"
        onKeyDown={(event) => {
          if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
          const memo = event.currentTarget.form?.elements.namedItem("memo");
          if (!(memo instanceof HTMLTextAreaElement)) return;
          event.preventDefault();
          memo.focus();
        }}
        placeholder="예: 오디세이한테 압도 당함"
        required
        aria-invalid={Boolean(activityError)}
        aria-describedby={activityError ? "activity-error" : undefined}
      />
      <FieldError id="activity-error">{activityError}</FieldError>
    </Field>
  );
}
