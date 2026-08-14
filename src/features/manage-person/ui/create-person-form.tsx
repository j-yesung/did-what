"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { useActionToast } from "@/shared/ui/toast";

import { createPerson } from "../model/actions";
import { INITIAL_PERSON_ACTION_STATE } from "../model/person-form";

export function CreatePersonForm() {
  const [state, formAction, pending] = useActionState(createPerson, INITIAL_PERSON_ACTION_STATE);
  const formRef = useRef<HTMLFormElement>(null);
  /** 어느 칸이 잘못됐는지는 입력란 아래에 남기고, 서버 실패만 토스트로 알린다. */
  useActionToast(state, { error: "추가하지 못했어요" });

  useEffect(() => {
    if (state.status === "error") {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      return;
    }

    if (state.status === "success") {
      /** 여러 명을 잇달아 추가할 수 있게 입력란을 비우고 커서를 되돌린다. */
      formRef.current?.reset();
      formRef.current?.querySelector<HTMLInputElement>("#person-name")?.focus();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction}>
      <Card>
        <CardHeader>
          <CardTitle>함께한 사람 추가</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={Boolean(state.fieldError)}>
              <FieldLabel htmlFor="person-name">이름</FieldLabel>
              {/* 이름은 짧아서 한 줄이면 충분하다. 버튼을 옆에 두어 엄지가 닿는 높이에서 입력과 추가가 끝난다. */}
              <div className="flex gap-2">
                <Input
                  id="person-name"
                  name="name"
                  className="h-11 flex-1"
                  maxLength={50}
                  placeholder="예: 다연"
                  required
                  autoComplete="off"
                  aria-invalid={Boolean(state.fieldError)}
                  aria-describedby={state.fieldError ? "person-name-error" : undefined}
                />
                <Button className="h-11 px-5" loading={pending} type="submit">
                  추가
                </Button>
              </div>
              <FieldError id="person-name-error">{state.fieldError}</FieldError>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>
    </form>
  );
}
