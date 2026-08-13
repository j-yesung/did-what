"use client";

import type { FormEvent } from "react";
import { useActionState, useEffect, useRef, useState } from "react";

import { CalendarDaysIcon, CircleAlertIcon, MessageSquareTextIcon, NotebookPenIcon, UsersIcon } from "lucide-react";

import type { PersonOption } from "@/entities/person";
import type { PlaceOption } from "@/entities/place";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { CheckboxChip } from "@/shared/ui/checkbox-chip";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Spinner } from "@/shared/ui/spinner";
import { Textarea } from "@/shared/ui/textarea";

import type { RecordLocationPlace, RecordLocationRegion } from "../model/location-picker";
import type { RecordActionState } from "../model/record-form";
import { RecordLocationFields } from "./record-location-fields";

const TODAY = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date());

const FIELD_ICON = "size-[18px] text-foreground [stroke-width:2]";

type RecordFormProps = {
  action: (state: RecordActionState, formData: FormData) => Promise<RecordActionState>;
  initialValues?: {
    activity: string;
    memo: string;
    personIds: string[];
    places: RecordLocationPlace[];
    recordedAt: string;
    region: RecordLocationRegion;
  };
  mode?: "create" | "edit";
  people: PersonOption[];
  savedPlaces: PlaceOption[];
};

const INITIAL_STATE: RecordActionState = { status: "idle" };

export function RecordForm({ action, initialValues, mode = "create", people, savedPlaces }: RecordFormProps) {
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);
  const [hasPersonError, setHasPersonError] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const personError = hasPersonError ? "함께한 사람을 선택해 주세요." : state.fieldErrors?.personIds;

  useEffect(() => {
    if (state.status === "error") {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], [role="alert"]')?.focus();
    }
  }, [state]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // 선택 상태는 체크박스가 직접 들고 있으므로 제출 직전에 폼에서 읽는다.
    if (event.currentTarget.querySelectorAll('input[name="personIds"]:checked').length > 0) {
      return;
    }

    event.preventDefault();
    setHasPersonError(true);
    event.currentTarget.querySelector<HTMLElement>('input[name="personIds"]')?.focus();
  }

  return (
    <form ref={formRef} className="flex flex-col gap-4" action={formAction} onSubmit={handleSubmit}>
      {state.message ? (
        <Alert variant="destructive" tabIndex={-1}>
          <CircleAlertIcon aria-hidden="true" />
          <AlertTitle>기록을 {mode === "edit" ? "수정" : "저장"}하지 못했어요</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="rounded-xl border border-border bg-surface px-[18px] py-5 shadow-[0_18px_50px_color-mix(in_srgb,var(--blue-950),transparent_94%)] motion-safe:animate-[enter_360ms_ease-out_both] motion-safe:[animation-delay:70ms]">
        <FieldGroup>
          <Field data-invalid={Boolean(state.fieldErrors?.recordedAt)}>
            <FieldLabel htmlFor="recordedAt">
              <CalendarDaysIcon className={FIELD_ICON} aria-hidden="true" />
              언제 <span className="font-[650] text-[11px] text-foreground">필수</span>
            </FieldLabel>
            <Input
              className="h-12"
              defaultValue={initialValues?.recordedAt ?? TODAY}
              id="recordedAt"
              name="recordedAt"
              required
              type="date"
              aria-invalid={Boolean(state.fieldErrors?.recordedAt)}
              aria-describedby={state.fieldErrors?.recordedAt ? "recordedAt-error" : undefined}
            />
            <FieldDescription>시간 없이 날짜만 기록해요.</FieldDescription>
            <FieldError id="recordedAt-error">{state.fieldErrors?.recordedAt}</FieldError>
          </Field>

          <FieldSeparator />

          <Field data-invalid={Boolean(personError)}>
            <FieldSet>
              <FieldLegend className="flex items-center gap-2" variant="label">
                <UsersIcon className={FIELD_ICON} aria-hidden="true" />
                누구와 <span className="font-[650] text-[11px] text-foreground">필수</span>
              </FieldLegend>
              <FieldDescription>한 명 이상 선택해 주세요.</FieldDescription>

              <div className="flex flex-wrap gap-1.5">
                {people.map((person) => (
                  <CheckboxChip
                    aria-describedby={personError ? "people-error" : undefined}
                    aria-invalid={Boolean(personError)}
                    defaultChecked={initialValues?.personIds.includes(person.id)}
                    key={person.id}
                    name="personIds"
                    onChange={() => setHasPersonError(false)}
                    value={person.id}
                  >
                    {person.name}
                  </CheckboxChip>
                ))}
              </div>
              <FieldError id="people-error">{personError}</FieldError>
            </FieldSet>
          </Field>

          <FieldSeparator />

          <RecordLocationFields
            initialPlaces={initialValues?.places}
            initialRegion={initialValues?.region}
            placeError={state.fieldErrors?.places}
            regionError={state.fieldErrors?.regionCode}
            savedPlaces={savedPlaces}
          />

          <FieldSeparator />

          <Field data-invalid={Boolean(state.fieldErrors?.activity)}>
            <FieldLabel htmlFor="activity">
              <NotebookPenIcon className={FIELD_ICON} aria-hidden="true" />
              무엇을 했나요? <span className="font-[650] text-[11px] text-foreground">필수</span>
            </FieldLabel>
            <Input
              className="h-12"
              defaultValue={initialValues?.activity}
              id="activity"
              maxLength={120}
              name="activity"
              placeholder="예: 영화 보고 저녁 먹음"
              required
              aria-invalid={Boolean(state.fieldErrors?.activity)}
              aria-describedby={state.fieldErrors?.activity ? "activity-error" : undefined}
            />
            <FieldDescription>가장 기억하고 싶은 일을 짧게 적어 주세요.</FieldDescription>
            <FieldError id="activity-error">{state.fieldErrors?.activity}</FieldError>
          </Field>

          <FieldSeparator />

          <Field data-invalid={Boolean(state.fieldErrors?.memo)}>
            <FieldLabel htmlFor="memo">
              <MessageSquareTextIcon className={FIELD_ICON} aria-hidden="true" />
              메모 <span className="font-[650] text-[11px] text-muted-foreground">선택</span>
            </FieldLabel>
            <Textarea
              className="min-h-24 resize-none"
              defaultValue={initialValues?.memo}
              id="memo"
              maxLength={500}
              name="memo"
              placeholder="더 남기고 싶은 이야기가 있다면 적어 주세요."
              rows={4}
              aria-invalid={Boolean(state.fieldErrors?.memo)}
              aria-describedby={state.fieldErrors?.memo ? "memo-error" : undefined}
            />
            <FieldError id="memo-error">{state.fieldErrors?.memo}</FieldError>
          </Field>
        </FieldGroup>

        <Button className="mt-5 h-14 w-full" size="lg" type="submit" disabled={pending}>
          {pending ? (
            <Spinner data-icon="inline-start" aria-label={`기록 ${mode === "edit" ? "수정" : "저장"} 중`} />
          ) : (
            <NotebookPenIcon data-icon="inline-start" />
          )}
          {pending ? `${mode === "edit" ? "수정" : "저장"} 중...` : mode === "edit" ? "수정 완료" : "기록 남기기"}
        </Button>
      </div>
    </form>
  );
}
