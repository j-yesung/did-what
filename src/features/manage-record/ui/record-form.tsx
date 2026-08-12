"use client";

import type { FormEvent } from "react";
import { useActionState, useEffect, useRef, useState } from "react";

import {
  CalendarDaysIcon,
  CircleAlertIcon,
  MapPinIcon,
  MessageSquareTextIcon,
  NotebookPenIcon,
  PlusIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";

import type { PersonOption } from "@/entities/person";
import type { PlaceOption } from "@/entities/place";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Button, buttonVariants } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { NativeSelect, NativeSelectOption } from "@/shared/ui/native-select";
import { Spinner } from "@/shared/ui/spinner";
import { Textarea } from "@/shared/ui/textarea";

import type { RecordActionState } from "../model/record-form";

const TODAY = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date());

const FIELD_ICON = "size-[18px] text-primary [stroke-width:2]";

type RecordFormProps = {
  action: (state: RecordActionState, formData: FormData) => Promise<RecordActionState>;
  initialValues?: {
    activity: string;
    memo: string;
    personIds: string[];
    placeId: string;
    recordedAt: string;
  };
  mode?: "create" | "edit";
  people: PersonOption[];
  places: PlaceOption[];
};

const INITIAL_STATE: RecordActionState = { status: "idle" };

export function RecordForm({ action, initialValues, mode = "create", people, places }: RecordFormProps) {
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>(initialValues?.personIds ?? []);
  const [hasPersonError, setHasPersonError] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const personError = hasPersonError ? "함께한 사람을 선택해 주세요." : state.fieldErrors?.personIds;

  useEffect(() => {
    if (state.status === "error") {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], [role="alert"]')?.focus();
    }
  }, [state]);

  function togglePerson(personId: string, checked: boolean) {
    setSelectedPersonIds((current) =>
      checked ? [...current, personId] : current.filter((selectedId) => selectedId !== personId),
    );
    setHasPersonError(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (selectedPersonIds.length > 0) {
      return;
    }

    event.preventDefault();
    setHasPersonError(true);
    event.currentTarget.querySelector<HTMLElement>("[role=checkbox]")?.focus();
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

      <div className="rounded-xl border border-border bg-surface px-[18px] py-5 shadow-[0_18px_50px_color-mix(in_srgb,var(--brand-950),transparent_94%)] motion-safe:animate-[enter_360ms_ease-out_both] motion-safe:[animation-delay:70ms]">
        <FieldGroup>
          <Field data-invalid={Boolean(state.fieldErrors?.recordedAt)}>
            <FieldLabel htmlFor="recordedAt">
              <CalendarDaysIcon className={FIELD_ICON} aria-hidden="true" />
              언제 <span className="font-[650] text-[11px] text-primary">필수</span>
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
                누구와 <span className="font-[650] text-[11px] text-primary">필수</span>
              </FieldLegend>
              <FieldDescription>한 명 이상 선택해 주세요.</FieldDescription>
              <FieldGroup className="grid grid-cols-2 gap-2" data-slot="checkbox-group">
                {people.map((person) => {
                  const isSelected = selectedPersonIds.includes(person.id);

                  return (
                    <FieldLabel htmlFor={`person-${person.id}`} key={person.id}>
                      <Field orientation="horizontal">
                        <Checkbox
                          aria-describedby={personError ? "people-error" : undefined}
                          aria-invalid={Boolean(personError)}
                          checked={isSelected}
                          id={`person-${person.id}`}
                          name="personIds"
                          onCheckedChange={(checked) => togglePerson(person.id, checked)}
                          value={person.id}
                        />
                        <Avatar className="size-8">
                          <AvatarFallback>{person.name[0]}</AvatarFallback>
                        </Avatar>
                        <FieldContent>
                          <FieldTitle>{person.name}</FieldTitle>
                        </FieldContent>
                      </Field>
                    </FieldLabel>
                  );
                })}
              </FieldGroup>
              <FieldError id="people-error">{personError}</FieldError>
            </FieldSet>
          </Field>

          <FieldSeparator />

          <Field data-invalid={Boolean(state.fieldErrors?.placeId)}>
            <FieldLabel htmlFor="placeId">
              <MapPinIcon className={FIELD_ICON} aria-hidden="true" />
              어디서 <span className="font-[650] text-[11px] text-primary">필수</span>
            </FieldLabel>
            <NativeSelect
              className="w-full [&_select]:h-12"
              defaultValue={initialValues?.placeId ?? ""}
              id="placeId"
              name="placeId"
              required
              aria-invalid={Boolean(state.fieldErrors?.placeId)}
              aria-describedby={state.fieldErrors?.placeId ? "placeId-error" : undefined}
            >
              <NativeSelectOption disabled value="">
                장소를 선택하세요
              </NativeSelectOption>
              {places.map((place) => (
                <NativeSelectOption key={place.id} value={place.id}>
                  {place.name}
                  {place.address ? ` · ${place.address}` : ""}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <FieldDescription>내 장소 목록에서 한 곳을 연결해요.</FieldDescription>
            {mode === "create" ? (
              <Link className={buttonVariants({ size: "sm", variant: "outline" })} href="/places">
                <PlusIcon aria-hidden="true" data-icon="inline-start" />새 장소 저장하기
              </Link>
            ) : null}
            <FieldError id="placeId-error">{state.fieldErrors?.placeId}</FieldError>
          </Field>

          <FieldSeparator />

          <Field data-invalid={Boolean(state.fieldErrors?.activity)}>
            <FieldLabel htmlFor="activity">
              <NotebookPenIcon className={FIELD_ICON} aria-hidden="true" />
              무엇을 했나요? <span className="font-[650] text-[11px] text-primary">필수</span>
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
      </div>

      <footer className="fixed right-[max(0px,calc((100vw-430px)/2))] bottom-[var(--nav-clearance)] left-[max(0px,calc((100vw-430px)/2))] flex flex-col gap-2 border-[color-mix(in_srgb,var(--border),transparent_28%)] border-t bg-[color-mix(in_srgb,var(--surface),transparent_3%)] px-5 pt-2.5 pb-3 text-center backdrop-blur-[18px] [&_p]:text-[11px] [&_p]:text-muted-foreground">
        <p>
          {mode === "edit"
            ? "수정한 내용은 상세 화면과 지도에 바로 반영돼요."
            : "저장하면 기록 목록에서 바로 확인할 수 있어요."}
        </p>
        <Button className="h-14 w-full" size="lg" type="submit" disabled={pending}>
          {pending ? (
            <Spinner data-icon="inline-start" aria-label={`기록 ${mode === "edit" ? "수정" : "저장"} 중`} />
          ) : (
            <NotebookPenIcon data-icon="inline-start" />
          )}
          {pending ? `${mode === "edit" ? "수정" : "저장"} 중...` : mode === "edit" ? "수정 완료" : "기록 남기기"}
        </Button>
      </footer>
    </form>
  );
}
