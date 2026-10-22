"use client";

import { Field, FieldError, FieldLabel } from "@/shared/ui/field";
import { PasswordInput } from "@/shared/ui/password-input";

type PasswordConfirmFieldProps = {
  error?: string;
};

export function PasswordConfirmField({ error }: PasswordConfirmFieldProps) {
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor="passwordConfirm">비밀번호 확인</FieldLabel>
      <PasswordInput
        className="h-11"
        id="passwordConfirm"
        name="passwordConfirm"
        toggleLabel="비밀번호 확인"
        autoComplete="new-password"
        minLength={6}
        required
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "passwordConfirm-error" : undefined}
        placeholder="비밀번호를 다시 입력해 주세요"
        variant="underline"
      />
      <FieldError id="passwordConfirm-error">{error}</FieldError>
    </Field>
  );
}
