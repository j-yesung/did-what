"use client";

import type { FormEvent } from "react";
import { useActionState, useEffect, useRef, useState } from "react";

import {
  CalendarDaysIcon,
  CircleAlertIcon,
  MapPinIcon,
  MessageSquareTextIcon,
  NotebookPenIcon,
  UsersIcon,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  createRecord,
  INITIAL_CREATE_RECORD_STATE,
  type PersonOption,
  type PlaceOption,
} from "@/features/create-record";

import styles from "./record-new-page.module.css";

const TODAY = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date());

type RecordNewFormProps = {
  people: PersonOption[];
  places: PlaceOption[];
};

export function RecordNewForm({ people, places }: RecordNewFormProps) {
  const [state, formAction, pending] = useActionState(createRecord, INITIAL_CREATE_RECORD_STATE);
  const [recordedAt, setRecordedAt] = useState(TODAY);
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>([]);
  const [placeId, setPlaceId] = useState("");
  const [activity, setActivity] = useState("");
  const [memo, setMemo] = useState("");
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
    <form ref={formRef} className={styles.form} action={formAction} onSubmit={handleSubmit}>
      {state.message ? (
        <Alert variant="destructive" tabIndex={-1}>
          <CircleAlertIcon aria-hidden="true" />
          <AlertTitle>기록을 저장하지 못했어요</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className={styles.formSurface}>
        <FieldGroup>
          <Field data-invalid={Boolean(state.fieldErrors?.recordedAt)}>
            <FieldLabel htmlFor="recordedAt">
              <CalendarDaysIcon className={styles.fieldIcon} aria-hidden="true" />
              언제 <span className={styles.required}>필수</span>
            </FieldLabel>
            <Input
              className="h-12"
              id="recordedAt"
              name="recordedAt"
              onChange={(event) => setRecordedAt(event.target.value)}
              required
              type="date"
              value={recordedAt}
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
                <UsersIcon className={styles.fieldIcon} aria-hidden="true" />
                누구와 <span className={styles.required}>필수</span>
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
              <MapPinIcon className={styles.fieldIcon} aria-hidden="true" />
              어디서 <span className={styles.required}>필수</span>
            </FieldLabel>
            <NativeSelect
              className="w-full [&_select]:h-12"
              id="placeId"
              name="placeId"
              onChange={(event) => setPlaceId(event.target.value)}
              required
              value={placeId}
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
            <FieldError id="placeId-error">{state.fieldErrors?.placeId}</FieldError>
          </Field>

          <FieldSeparator />

          <Field data-invalid={Boolean(state.fieldErrors?.activity)}>
            <FieldLabel htmlFor="activity">
              <NotebookPenIcon className={styles.fieldIcon} aria-hidden="true" />
              무엇을 했나요? <span className={styles.required}>필수</span>
            </FieldLabel>
            <Input
              className="h-12"
              id="activity"
              maxLength={120}
              name="activity"
              onChange={(event) => setActivity(event.target.value)}
              placeholder="예: 영화 보고 저녁 먹음"
              required
              value={activity}
              aria-invalid={Boolean(state.fieldErrors?.activity)}
              aria-describedby={state.fieldErrors?.activity ? "activity-error" : undefined}
            />
            <FieldDescription>가장 기억하고 싶은 일을 짧게 적어 주세요.</FieldDescription>
            <FieldError id="activity-error">{state.fieldErrors?.activity}</FieldError>
          </Field>

          <FieldSeparator />

          <Field data-invalid={Boolean(state.fieldErrors?.memo)}>
            <FieldLabel htmlFor="memo">
              <MessageSquareTextIcon className={styles.fieldIcon} aria-hidden="true" />
              메모 <span className={styles.optional}>선택</span>
            </FieldLabel>
            <Textarea
              className="min-h-24 resize-none"
              id="memo"
              maxLength={500}
              name="memo"
              onChange={(event) => setMemo(event.target.value)}
              placeholder="더 남기고 싶은 이야기가 있다면 적어 주세요."
              rows={4}
              value={memo}
              aria-invalid={Boolean(state.fieldErrors?.memo)}
              aria-describedby={state.fieldErrors?.memo ? "memo-error" : undefined}
            />
            <FieldError id="memo-error">{state.fieldErrors?.memo}</FieldError>
          </Field>
        </FieldGroup>
      </div>

      <footer className={styles.footer}>
        <p>저장하면 기록 목록에서 바로 확인할 수 있어요.</p>
        <Button className="h-14 w-full" size="lg" type="submit" disabled={pending}>
          {pending ? (
            <Spinner data-icon="inline-start" aria-label="기록 저장 중" />
          ) : (
            <NotebookPenIcon data-icon="inline-start" />
          )}
          {pending ? "저장 중..." : "기록 남기기"}
        </Button>
      </footer>
    </form>
  );
}
