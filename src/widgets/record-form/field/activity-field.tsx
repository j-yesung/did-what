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
        placeholder="예: 오디세이한테 압도 당함"
        required
        aria-invalid={Boolean(activityError)}
        aria-describedby={activityError ? "activity-error" : undefined}
      />
      <FieldError id="activity-error">{activityError}</FieldError>
    </Field>
  );
}
