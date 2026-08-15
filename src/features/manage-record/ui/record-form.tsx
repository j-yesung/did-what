"use client";

import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";

import { CalendarDotsIcon, ChatTextIcon, NotePencilIcon, UsersIcon } from "@phosphor-icons/react";

import type { PersonOption } from "@/entities/person";
import type { PlaceOption } from "@/entities/place";
import { useActionMutation } from "@/shared/lib/server-action/use-action-mutation";
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
import { Textarea } from "@/shared/ui/textarea";

import type { RecordLocationPlace, RecordLocationRegion } from "../model/location-picker";
import type { RecordActionState } from "../model/record-form";
import { RecordLocationFields } from "./record-location-fields";

const TODAY = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date());

const FIELD_ICON = "size-4.5 text-foreground [stroke-width:2]";

type RecordFormProps = {
  action: (formData: FormData) => Promise<RecordActionState>;
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

export function RecordForm({ action, initialValues, mode = "create", people, savedPlaces }: RecordFormProps) {
  const [hasPersonError, setHasPersonError] = useState(false);
  const [memoLength, setMemoLength] = useState(initialValues?.memo.length ?? 0);
  const formRef = useRef<HTMLFormElement>(null);

  /** 어느 칸이 잘못됐는지는 입력란 아래에 남기고, 저장 자체가 실패한 것만 토스트로 알린다. */
  const save = useActionMutation(action, {
    error: `기록을 ${mode === "edit" ? "수정" : "저장"}하지 못했어요`,
    success: mode === "edit" ? "기록을 수정했어요" : "기록을 남겼어요",
    onFail: () => {
      if (formRef.current) formRef.current.dataset.dirty = "true";
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    },
  });
  const fieldErrors = save.data?.fieldErrors;
  const personError = hasPersonError ? "함께한 사람을 선택해 주세요." : fieldErrors?.personIds;

  useEffect(() => {
    function warnBeforeUnload(event: BeforeUnloadEvent) {
      if (formRef.current?.dataset.dirty !== "true") return;

      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, []);

  function markDirty() {
    if (formRef.current) formRef.current.dataset.dirty = "true";
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (event.currentTarget.querySelectorAll('input[name="personIds"]:checked').length === 0) {
      setHasPersonError(true);
      event.currentTarget.querySelector<HTMLElement>('input[name="personIds"]')?.focus();
      return;
    }

    // 저장을 시작하면 이탈 경고를 끈다. 성공하면 화면이 바뀌고, 실패하면 onFail이 다시 켠다.
    event.currentTarget.dataset.dirty = "false";
    save.mutate(new FormData(event.currentTarget));
  }

  return (
    <form
      ref={formRef}
      className="flex flex-col gap-4"
      data-dirty="false"
      id="record-form"
      onChange={markDirty}
      onSubmit={handleSubmit}
    >
      <div className="rounded-xl border border-border bg-surface px-4.5 py-5 motion-safe:animate-[enter_360ms_ease-out_both] motion-safe:[animation-delay:70ms]">
        <FieldGroup>
          <Field data-invalid={Boolean(fieldErrors?.recordedAt)}>
            <FieldLabel htmlFor="recordedAt">
              <CalendarDotsIcon strokeWidth={2} className={FIELD_ICON} aria-hidden="true" />
              언제 <span className="font-[650] text-[11px] text-foreground">필수</span>
            </FieldLabel>
            <Input
              className="h-12"
              defaultValue={initialValues?.recordedAt ?? TODAY}
              id="recordedAt"
              name="recordedAt"
              required
              type="date"
              aria-invalid={Boolean(fieldErrors?.recordedAt)}
              aria-describedby={fieldErrors?.recordedAt ? "recordedAt-error" : undefined}
            />
            <FieldError id="recordedAt-error">{fieldErrors?.recordedAt}</FieldError>
          </Field>

          <FieldSeparator />

          <Field data-invalid={Boolean(personError)}>
            <FieldSet>
              <FieldLegend className="flex items-center gap-2" variant="label">
                <UsersIcon strokeWidth={2} className={FIELD_ICON} aria-hidden="true" />
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
            onChange={markDirty}
            placeError={fieldErrors?.places}
            regionError={fieldErrors?.regionCode}
            savedPlaces={savedPlaces}
          />

          <FieldSeparator />

          <Field data-invalid={Boolean(fieldErrors?.activity)}>
            <FieldLabel htmlFor="activity">
              <NotePencilIcon strokeWidth={2} className={FIELD_ICON} aria-hidden="true" />
              무엇을 했나요? <span className="font-[650] text-[11px] text-foreground">필수</span>
            </FieldLabel>
            <FieldDescription>가장 기억하고 싶은 일을 짧게 적어 주세요.</FieldDescription>

            <Input
              className="h-12"
              defaultValue={initialValues?.activity}
              id="activity"
              maxLength={120}
              name="activity"
              placeholder="예: 영화 보고 저녁 먹음"
              required
              aria-invalid={Boolean(fieldErrors?.activity)}
              aria-describedby={fieldErrors?.activity ? "activity-error" : undefined}
            />
            <FieldError id="activity-error">{fieldErrors?.activity}</FieldError>
          </Field>

          <FieldSeparator />

          <Field data-invalid={Boolean(fieldErrors?.memo)}>
            <FieldLabel htmlFor="memo">
              <ChatTextIcon strokeWidth={2} className={FIELD_ICON} aria-hidden="true" />
              메모 <span className="font-[650] text-[11px] text-muted-foreground">선택</span>
            </FieldLabel>
            <Textarea
              className="min-h-24 resize-none"
              defaultValue={initialValues?.memo}
              id="memo"
              maxLength={500}
              name="memo"
              onChange={(event) => setMemoLength(event.currentTarget.value.length)}
              placeholder="더 남기고 싶은 이야기가 있다면 적어 주세요."
              rows={4}
              aria-invalid={Boolean(fieldErrors?.memo)}
              aria-describedby={fieldErrors?.memo ? "memo-count memo-error" : "memo-count"}
            />
            <FieldDescription
              className="invisible text-right tabular-nums group-focus-within/field:visible"
              id="memo-count"
            >
              {memoLength}/500
            </FieldDescription>
            <FieldError id="memo-error">{fieldErrors?.memo}</FieldError>
          </Field>
        </FieldGroup>

        <Button className="mt-5 h-14 w-full" loading={save.isPending} size="lg" type="submit">
          {mode === "edit" ? "수정 완료" : "기록 남기기"}
        </Button>
      </div>
    </form>
  );
}
