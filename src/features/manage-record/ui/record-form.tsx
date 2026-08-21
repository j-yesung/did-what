"use client";

import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import type { DateRange } from "react-day-picker";
import { ko } from "react-day-picker/locale";

import { CalendarDotsIcon, ChatTextIcon, NotePencilIcon, UsersIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import Link from "next/link";

import { peopleQueryOptions } from "@/entities/person/api/people-query";
import { placesQueryOptions } from "@/entities/place/api/places-query";
import { recordsQueryOptions } from "@/entities/record/api/records-query";
import { useGoBack } from "@/shared/lib/navigation/use-go-back";
import { useActionMutation } from "@/shared/lib/server-action/use-action-mutation";
import { Button } from "@/shared/ui/button";
import { Calendar } from "@/shared/ui/calendar";
import { CheckboxChip } from "@/shared/ui/checkbox-chip";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty";
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
import { LeaveGuard } from "@/shared/ui/leave-guard";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Spinner } from "@/shared/ui/spinner";
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
    recordedUntil: string | null;
    region: RecordLocationRegion;
  };
  mode?: "create" | "edit";
  /** 돌아갈 화면이 없을 때 저장 후 갈 곳. 헤더 뒤로가기의 fallback과 같은 값을 준다. */
  returnTo: string;
};

export function RecordForm({ action, initialValues, mode = "create", returnTo }: RecordFormProps) {
  const goBackTo = useGoBack();
  const peopleQuery = useQuery(peopleQueryOptions);
  const placesQuery = useQuery(placesQueryOptions);
  const [hasPersonError, setHasPersonError] = useState(false);
  const [memoLength, setMemoLength] = useState(initialValues?.memo.length ?? 0);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>(() => ({
    from: parseISO(initialValues?.recordedAt ?? TODAY),
    to: parseISO(initialValues?.recordedUntil ?? initialValues?.recordedAt ?? TODAY),
  }));
  const [draftDateRange, setDraftDateRange] = useState<DateRange>();
  const formRef = useRef<HTMLFormElement>(null);
  const selectedStart = dateRange.from ?? parseISO(TODAY);
  const selectedEnd = dateRange.to ?? selectedStart;
  const recordedAt = format(selectedStart, "yyyy-MM-dd");
  const recordedUntil = format(selectedEnd, "yyyy-MM-dd");

  /** 어느 칸이 잘못됐는지는 입력란 아래에 남기고, 저장 자체가 실패한 것만 토스트로 알린다. */
  const save = useActionMutation(action, {
    error: `기록을 ${mode === "edit" ? "수정" : "저장"}하지 못했어요`,
    invalidate: [recordsQueryOptions.queryKey, placesQueryOptions.queryKey],
    success: mode === "edit" ? "기록을 수정했어요" : "기록을 남겼어요",
    onSuccess: () => goBackTo(returnTo),
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

    // 저장을 시작하면 이탈 경고를 끈다. 성공하면 왔던 화면으로 돌아가고, 실패하면 onFail이 다시 켠다.
    event.currentTarget.dataset.dirty = "false";
    save.mutate(new FormData(event.currentTarget));
  }

  if (peopleQuery.isPending || placesQuery.isPending) {
    return (
      <div className="grid min-h-48 place-items-center">
        <Spinner
          aria-label="선택지를 불러오는 중"
          className="motion-safe:fade-in size-6 text-muted-foreground motion-safe:animate-in motion-safe:fill-mode-both motion-safe:delay-300"
        />
      </div>
    );
  }

  if (peopleQuery.isError || placesQuery.isError) {
    return <LoadErrorAlert title="선택지를 불러오지 못했어요" />;
  }

  if (peopleQuery.data.length === 0) {
    return (
      <Empty className="border bg-card py-12">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <NotePencilIcon strokeWidth={2} aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>기록 전에 준비가 필요해요</EmptyTitle>
          <EmptyDescription>기록에 연결할 사람을 먼저 추가해 주세요.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button className="w-full" render={<Link href="/people" />} nativeButton={false}>
            사람 추가하러 가기
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  const people = peopleQuery.data;
  const savedPlaces = placesQuery.data;

  return (
    <form
      ref={formRef}
      className="flex flex-col gap-4"
      data-dirty="false"
      id="record-form"
      onChange={markDirty}
      onSubmit={handleSubmit}
    >
      <LeaveGuard fallbackHref={returnTo} isDirty={() => formRef.current?.dataset.dirty === "true"} />
      <div className="rounded-xl border border-border bg-surface px-4.5 py-5 motion-safe:animate-[enter_360ms_ease-out_both] motion-safe:[animation-delay:70ms]">
        <FieldGroup>
          <FieldSet>
            <FieldLegend className="flex items-center gap-2" variant="label">
              <CalendarDotsIcon strokeWidth={2} className={FIELD_ICON} aria-hidden="true" />
              언제 <span className="font-[650] text-[11px] text-foreground">필수</span>
            </FieldLegend>
            <Field data-invalid={Boolean(fieldErrors?.recordedAt || fieldErrors?.recordedUntil)}>
              <Popover
                onOpenChange={(open) => {
                  setDatePickerOpen(open);
                  if (open) setDraftDateRange(dateRange);
                }}
                open={datePickerOpen}
              >
                <PopoverTrigger
                  render={
                    <Button
                      className="h-auto min-h-12 w-full justify-start px-3 py-2 text-left [&>span]:w-full"
                      type="button"
                      variant="outline"
                      aria-invalid={Boolean(fieldErrors?.recordedAt || fieldErrors?.recordedUntil)}
                      aria-describedby={
                        fieldErrors?.recordedAt || fieldErrors?.recordedUntil ? "record-date-error" : undefined
                      }
                    />
                  }
                >
                  <span className="flex w-full items-center justify-between gap-3">
                    <span>{recordedAt === recordedUntil ? recordedAt : `${recordedAt} ~ ${recordedUntil}`}</span>
                    <span className="shrink-0 text-muted-foreground text-xs">기간 설정</span>
                  </span>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-(--anchor-width) gap-0 p-0">
                  <Calendar
                    className="w-full"
                    classNames={{ root: "w-full" }}
                    defaultMonth={draftDateRange?.from ?? selectedStart}
                    locale={ko}
                    mode="range"
                    onSelect={setDraftDateRange}
                    selected={draftDateRange}
                  />
                  <div className="border-t p-2">
                    <Button
                      className="h-10 w-full"
                      disabled={!draftDateRange?.from}
                      onClick={() => {
                        if (!draftDateRange?.from) return;
                        setDateRange({ from: draftDateRange.from, to: draftDateRange.to ?? draftDateRange.from });
                        setDatePickerOpen(false);
                      }}
                      type="button"
                    >
                      적용
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              <input name="recordedAt" type="hidden" value={recordedAt} />
              <input name="recordedUntil" type="hidden" value={recordedUntil} />
              <FieldError id="record-date-error">{fieldErrors?.recordedAt ?? fieldErrors?.recordedUntil}</FieldError>
            </Field>
          </FieldSet>

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
