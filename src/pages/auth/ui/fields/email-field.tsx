"use client";

import { useRef, useState } from "react";

import { XCircleIcon } from "@phosphor-icons/react";

import { Field, FieldError, FieldLabel } from "@/shared/ui/field";
import { IconButton } from "@/shared/ui/icon-button";
import { Input } from "@/shared/ui/input";

type EmailFieldProps = {
  error?: string;
};

export function EmailField({ error }: EmailFieldProps) {
  const emailInputRef = useRef<HTMLInputElement>(null);
  const [hasEmail, setHasEmail] = useState(false);

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor="email">이메일</FieldLabel>
      <Input
        className="h-11"
        id="email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "email-error" : undefined}
        actionButton={
          hasEmail ? (
            <IconButton
              aria-label="이메일 지우기"
              icon={XCircleIcon}
              iconSize={18}
              iconStrokeWidth={2}
              iconWeight="fill"
              onClick={() => {
                if (emailInputRef.current) {
                  emailInputRef.current.value = "";
                }
                setHasEmail(false);
                emailInputRef.current?.focus();
              }}
              onMouseDown={(event) => event.preventDefault()}
              size="sm"
              type="button"
            />
          ) : null
        }
        onChange={(event) => setHasEmail(Boolean(event.target.value))}
        placeholder="이메일을 입력해 주세요"
        ref={emailInputRef}
        variant="underline"
      />
      <FieldError id="email-error">{error}</FieldError>
    </Field>
  );
}
