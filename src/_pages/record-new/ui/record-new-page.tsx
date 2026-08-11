"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import {
  CalendarDaysIcon,
  CheckCircle2Icon,
  ChevronLeftIcon,
  MapPinIcon,
  MessageSquareTextIcon,
  NotebookPenIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";

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
import { Textarea } from "@/components/ui/textarea";

import { createRecordInput, MOCK_PEOPLE, MOCK_PLACES, type RecordInput } from "../model/record-form";
import styles from "./record-new-page.module.css";

const TODAY = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date());

export function RecordNewPage() {
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>([]);
  const [hasPersonError, setHasPersonError] = useState(false);
  const [validatedInput, setValidatedInput] = useState<RecordInput | null>(null);

  function togglePerson(personId: string, checked: boolean) {
    setSelectedPersonIds((current) =>
      checked ? [...current, personId] : current.filter((selectedId) => selectedId !== personId),
    );
    setHasPersonError(false);
    setValidatedInput(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    setValidatedInput(null);

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (selectedPersonIds.length === 0) {
      setHasPersonError(true);
      form.querySelector<HTMLElement>("[role=checkbox]")?.focus();
      return;
    }

    const formData = new FormData(form);

    setValidatedInput(
      createRecordInput({
        recordedAt: String(formData.get("recordedAt")),
        personIds: selectedPersonIds,
        placeId: String(formData.get("placeId")),
        activity: String(formData.get("activity")),
        memo: String(formData.get("memo")),
      }),
    );
  }

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <Button
          aria-label="홈으로 돌아가기"
          nativeButton={false}
          render={<Link href="/" />}
          size="icon-lg"
          variant="ghost"
        >
          <ChevronLeftIcon />
        </Button>
        <div>
          <p className={styles.eyebrow}>NEW RECORD</p>
          <h1>새 기록</h1>
        </div>
      </header>

      <section className={styles.intro} aria-labelledby="record-intro-title">
        <h2 id="record-intro-title">오늘의 장면을 남겨보세요.</h2>
        <p>날짜, 사람, 장소와 한 일을 한 화면에서 빠르게 기록할 수 있어요.</p>
      </section>

      <form className={styles.form} onSubmit={handleSubmit} onChange={() => setValidatedInput(null)}>
        <div className={styles.formSurface}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="recordedAt">
                <CalendarDaysIcon className={styles.fieldIcon} aria-hidden="true" />
                언제 <span className={styles.required}>필수</span>
              </FieldLabel>
              <Input className="h-12" defaultValue={TODAY} id="recordedAt" name="recordedAt" required type="date" />
              <FieldDescription>시간 없이 날짜만 기록해요.</FieldDescription>
            </Field>

            <FieldSeparator />

            <Field data-invalid={hasPersonError}>
              <FieldSet>
                <FieldLegend className="flex items-center gap-2" variant="label">
                  <UsersIcon className={styles.fieldIcon} aria-hidden="true" />
                  누구와 <span className={styles.required}>필수</span>
                </FieldLegend>
                <FieldDescription>한 명 이상 선택해 주세요.</FieldDescription>
                <FieldGroup className="grid grid-cols-2 gap-2" data-slot="checkbox-group">
                  {MOCK_PEOPLE.map((person) => {
                    const isSelected = selectedPersonIds.includes(person.id);

                    return (
                      <FieldLabel htmlFor={person.id} key={person.id}>
                        <Field orientation="horizontal">
                          <Checkbox
                            aria-describedby={hasPersonError ? "people-error" : undefined}
                            aria-invalid={hasPersonError || undefined}
                            checked={isSelected}
                            id={person.id}
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
                {hasPersonError ? <FieldError id="people-error">함께한 사람을 선택해 주세요.</FieldError> : null}
              </FieldSet>
            </Field>

            <FieldSeparator />

            <Field>
              <FieldLabel htmlFor="placeId">
                <MapPinIcon className={styles.fieldIcon} aria-hidden="true" />
                어디서 <span className={styles.required}>필수</span>
              </FieldLabel>
              <NativeSelect className="w-full [&_select]:h-12" id="placeId" name="placeId" required>
                <NativeSelectOption disabled value="">
                  장소를 선택하세요
                </NativeSelectOption>
                {MOCK_PLACES.map((place) => (
                  <NativeSelectOption key={place.id} value={place.id}>
                    {place.name} · {place.address}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldDescription>현재는 예시 장소이며, 기록에는 장소 ID만 연결해요.</FieldDescription>
            </Field>

            <FieldSeparator />

            <Field>
              <FieldLabel htmlFor="activity">
                <NotebookPenIcon className={styles.fieldIcon} aria-hidden="true" />
                무엇을 했나요? <span className={styles.required}>필수</span>
              </FieldLabel>
              <Input
                className="h-12"
                id="activity"
                maxLength={120}
                name="activity"
                placeholder="예: 영화 보고 저녁 먹음"
                required
              />
              <FieldDescription>가장 기억하고 싶은 일을 짧게 적어 주세요.</FieldDescription>
            </Field>

            <FieldSeparator />

            <Field>
              <FieldLabel htmlFor="memo">
                <MessageSquareTextIcon className={styles.fieldIcon} aria-hidden="true" />
                메모 <span className={styles.optional}>선택</span>
              </FieldLabel>
              <Textarea
                className="min-h-24 resize-none"
                id="memo"
                maxLength={500}
                name="memo"
                placeholder="더 남기고 싶은 이야기가 있다면 적어 주세요."
                rows={4}
              />
            </Field>
          </FieldGroup>
        </div>

        {validatedInput ? (
          <Alert>
            <CheckCircle2Icon aria-hidden="true" />
            <AlertTitle>입력값을 확인했어요</AlertTitle>
            <AlertDescription>
              {validatedInput.personIds.length}명과의 기록 형식이 유효합니다. 현재는 서버에 저장되지 않아요.
            </AlertDescription>
          </Alert>
        ) : null}

        <footer className={styles.footer}>
          <p>현재는 입력 검증만 진행되며 데이터는 저장되지 않습니다.</p>
          <Button className="h-14 w-full" size="lg" type="submit">
            <NotebookPenIcon data-icon="inline-start" />
            기록 남기기
          </Button>
        </footer>
      </form>
    </main>
  );
}
