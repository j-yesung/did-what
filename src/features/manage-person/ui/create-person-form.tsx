"use client";

import { useActionState, useEffect, useRef } from "react";

import { CircleAlertIcon, PlusIcon, UserRoundPlusIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Spinner } from "@/shared/ui/spinner";

import { createPerson } from "../model/actions";
import { INITIAL_PERSON_ACTION_STATE } from "../model/person-form";

export function CreatePersonForm() {
  const [state, formAction, pending] = useActionState(createPerson, INITIAL_PERSON_ACTION_STATE);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "error") {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], [role="alert"]')?.focus();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction}>
      <Card>
        <CardHeader>
          <CardTitle>함께한 사람 추가</CardTitle>
          <CardDescription>기록에서 선택할 이름을 입력해 주세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            {state.message ? (
              <Alert variant={state.status === "error" ? "destructive" : "default"} tabIndex={-1}>
                {state.status === "error" ? (
                  <CircleAlertIcon aria-hidden="true" />
                ) : (
                  <UserRoundPlusIcon aria-hidden="true" />
                )}
                <AlertTitle>{state.status === "error" ? "추가하지 못했어요" : "추가했어요"}</AlertTitle>
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>
            ) : null}
            <Field data-invalid={Boolean(state.fieldError)}>
              <FieldLabel htmlFor="person-name">이름</FieldLabel>
              <Input
                id="person-name"
                name="name"
                maxLength={50}
                placeholder="예: 다연"
                required
                autoComplete="off"
                aria-invalid={Boolean(state.fieldError)}
                aria-describedby={state.fieldError ? "person-name-error" : undefined}
              />
              <FieldError id="person-name-error">{state.fieldError}</FieldError>
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter>
          <Button className="w-full" type="submit" disabled={pending}>
            {pending ? (
              <Spinner data-icon="inline-start" aria-label="사람 추가 중" />
            ) : (
              <PlusIcon data-icon="inline-start" />
            )}
            {pending ? "추가 중..." : "사람 추가"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
