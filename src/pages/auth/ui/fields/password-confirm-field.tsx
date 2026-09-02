"use client";

import { useState } from "react";

import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";

import { Field, FieldError, FieldLabel } from "@/shared/ui/field";
import { IconButton } from "@/shared/ui/icon-button";
import { Input } from "@/shared/ui/input";

type PasswordConfirmFieldProps = {
  error?: string;
};

export function PasswordConfirmField({ error }: PasswordConfirmFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor="passwordConfirm">비밀번호 확인</FieldLabel>
      <Input
        className="h-11"
        id="passwordConfirm"
        name="passwordConfirm"
        actionButton={
          <IconButton
            aria-label={visible ? "비밀번호 확인 숨기기" : "비밀번호 확인 표시"}
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
