"use client";

import { Field, FieldDescription, FieldError, FieldLabel } from "@/shared/ui/field";
import { PasswordInput } from "@/shared/ui/password-input";

type PasswordFieldProps = {
  error?: string;
  isSignup: boolean;
};

export function PasswordField({ error, isSignup }: PasswordFieldProps) {
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor="password">비밀번호</FieldLabel>
      {isSignup ? <FieldDescription>6자 이상 입력해 주세요.</FieldDescription> : null}
      <PasswordInput
        className="h-11"
        id="password"
        name="password"
        autoComplete={isSignup ? "new-password" : "current-password"}
        minLength={isSignup ? 6 : undefined}
        required
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "password-error" : undefined}
        placeholder={isSignup ? "비밀번호를 입력해 주세요" : "비밀번호"}
        variant="underline"
      />
      <FieldError id="password-error">{error}</FieldError>
    </Field>
  );
}
