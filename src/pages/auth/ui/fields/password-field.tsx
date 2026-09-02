"use client";

import { useState } from "react";

import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";

import { Field, FieldDescription, FieldError, FieldLabel } from "@/shared/ui/field";
import { IconButton } from "@/shared/ui/icon-button";
import { Input } from "@/shared/ui/input";

type PasswordFieldProps = {
  error?: string;
  isSignup: boolean;
};

export function PasswordField({ error, isSignup }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor="password">비밀번호</FieldLabel>
      {isSignup ? <FieldDescription>6자 이상 입력해 주세요.</FieldDescription> : null}
      <Input
        className="h-11"
        id="password"
        name="password"
        actionButton={
          <IconButton
            aria-label={visible ? "비밀번호 숨기기" : "비밀번호 표시"}
            icon={visible ? EyeSlashIcon : EyeIcon}
            iconSize={18}
            iconStrokeWidth={2}
            onClick={() => setVisible((current) => !current)}
            onMouseDown={(event) => event.preventDefault()}
            size="sm"
            type="button"
          />
        }
        type={visible ? "text" : "password"}
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
