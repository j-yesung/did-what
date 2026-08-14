"use client";

import { type FormEvent, useRef } from "react";

import { useActionMutation } from "@/shared/lib/server-action/use-action-mutation";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";

import { createPerson } from "../model/actions";

export function CreatePersonForm() {
  const formRef = useRef<HTMLFormElement>(null);

  const create = useActionMutation(createPerson, {
    error: "추가하지 못했어요",
    onSuccess: () => {
      formRef.current?.reset();
      formRef.current?.querySelector<HTMLInputElement>("#person-name")?.focus();
    },
    onFail: () => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    create.mutate(new FormData(event.currentTarget));
  }

  const fieldError = create.data?.fieldError;

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>함께한 사람 추가</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={Boolean(fieldError)}>
              <FieldLabel htmlFor="person-name">이름</FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="person-name"
                  name="name"
                  className="h-11 flex-1"
                  maxLength={50}
                  required
                  autoComplete="off"
                  aria-invalid={Boolean(fieldError)}
                  aria-describedby={fieldError ? "person-name-error" : undefined}
                />
                <Button className="h-11 px-5" loading={create.isPending} type="submit">
                  추가
                </Button>
              </div>
              <FieldError id="person-name-error">{fieldError}</FieldError>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>
    </form>
  );
}
