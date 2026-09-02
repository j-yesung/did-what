"use client";

import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import type { DateRange } from "react-day-picker";
import { ko } from "react-day-picker/locale";

import { MapPinCheckIcon, PencilIcon } from "@animateicons/react/lucide";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";

import { placesQueryOptions } from "@/entities/place";
import {
  DEFAULT_RECORD_WEATHER,
  isRecordWeather,
  RECORD_WEATHER_OPTIONS,
  type RecordFieldErrors,
  type RecordWeather,
  recordsQueryOptions,
  WeatherIcon,
} from "@/entities/record";
import { getPushEndpoint } from "@/features/push-notification";
import {
  RecordLocationFields,
  type RecordLocationPlace,
  type RecordLocationRegion,
} from "@/features/record/select-record-location";
import { useActionMutation } from "@/shared/lib/server-action/use-action-mutation";
import { Button } from "@/shared/ui/button";
import { Calendar } from "@/shared/ui/calendar";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/shared/ui/drawer";
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
import type { LeaveGuardHandle } from "@/shared/ui/leave-guard";
import { LeaveGuard } from "@/shared/ui/leave-guard";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { SegmentedControl, SegmentedControlItem } from "@/shared/ui/segmented-control";
import { Spinner } from "@/shared/ui/spinner";
import { Textarea } from "@/shared/ui/textarea";

const FIELD_ICON = "size-4.5 text-foreground [stroke-width:2]";

type RecordFormState = {
  fieldErrors?: RecordFieldErrors;
  message?: string;
  status: "error" | "success";
};

type RecordFormProps = {
  action: (formData: FormData) => Promise<RecordFormState>;
  defaultRecordedAt: string;
  initialValues?: {
    activity: string;
    memo: string;
    places: RecordLocationPlace[];
    recordedAt: string;
    recordedUntil: string | null;
    region: RecordLocationRegion;
    weather: RecordWeather;
  };
  mode?: "create" | "edit";
  /** 헤더 뒤로가기의 fallback과 같은 값. 저장을 취소하고 나갈 때 돌아갈 곳이다. */
  returnTo: string;
  /** 저장에 성공했을 때 갈 곳. 작성은 목록, 수정은 그 기록의 상세다. */
  savedTo: string;
};

export function RecordForm({
  action,
  defaultRecordedAt,
  initialValues,
  mode = "create",
  returnTo,
  savedTo,
}: RecordFormProps) {
  const guardRef = useRef<LeaveGuardHandle>(null);
  const placesQuery = useQuery(placesQueryOptions);
  const [memoLength, setMemoLength] = useState(initialValues?.memo.length ?? 0);
  const [weather, setWeather] = useState<RecordWeather>(initialValues?.weather ?? DEFAULT_RECORD_WEATHER);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const initialRecordedAt = initialValues?.recordedAt ?? defaultRecordedAt;
  const [dateRange, setDateRange] = useState<DateRange>(() => ({
    from: parseISO(initialRecordedAt),
    to: parseISO(initialValues?.recordedUntil ?? initialRecordedAt),
  }));
  const [draftDateRange, setDraftDateRange] = useState<DateRange>();
  const formRef = useRef<HTMLFormElement>(null);
  const selectedStart = dateRange.from ?? parseISO(initialRecordedAt);
  const selectedEnd = dateRange.to ?? selectedStart;
  const recordedAt = format(selectedStart, "yyyy-MM-dd");
  const recordedUntil = format(selectedEnd, "yyyy-MM-dd");

  /** 어느 칸이 잘못됐는지는 입력란 아래에 남기고, 저장 자체가 실패한 것만 토스트로 알린다. */
  const save = useActionMutation(action, {
    error: `기록을 ${mode === "edit" ? "수정" : "저장"}하지 못했어요`,
    icon: mode === "edit" ? PencilIcon : MapPinCheckIcon,
    invalidate: [recordsQueryOptions.queryKey, placesQueryOptions.queryKey],
    success: mode === "edit" ? "기록을 수정했어요" : "기록을 남겼어요",
    onSuccess: () => guardRef.current?.finish(savedTo),
    onFail: () => {
      if (formRef.current) formRef.current.dataset.dirty = "true";
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    },
  });
  const fieldErrors = save.data?.fieldErrors;

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    form.dataset.dirty = "false";
    const formData = new FormData(form);

    /**
     * 계정을 함께 쓰므로 서버는 어느 기기가 보냈는지 알 수 없다.
     * 작성한 기기에는 알림이 가지 않도록 이 기기의 구독 endpoint를 실어 보낸다.
     */
    if (mode === "create") {
      const endpoint = await getPushEndpoint();
      if (endpoint) formData.set("senderEndpoint", endpoint);
    }

    save.mutate(formData);
  }

  if (placesQuery.isPending) {
    return (
      <div className="fixed inset-0 grid place-items-center">
        <Spinner
          aria-label="선택지를 불러오는 중"
          className="motion-safe:fade-in text-muted-foreground motion-safe:animate-in motion-safe:fill-mode-both motion-safe:delay-300"
        />
      </div>
    );
  }

  if (placesQuery.isError) {
    return <LoadErrorAlert title="선택지를 불러오지 못했어요" />;
  }

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
      <LeaveGuard fallbackHref={returnTo} isDirty={() => formRef.current?.dataset.dirty === "true"} ref={guardRef} />
      <div className="px-1 py-1">
        <FieldGroup>
          <FieldSet>
            <FieldLegend variant="label">언제</FieldLegend>
            <Field data-invalid={Boolean(fieldErrors?.recordedAt || fieldErrors?.recordedUntil)}>
              <Drawer
                onOpenChange={(open) => {
                  setDatePickerOpen(open);
                  if (open) setDraftDateRange(dateRange);
                }}
                open={datePickerOpen}
                showSwipeHandle
              >
                <DrawerTrigger
                  render={
                    <Button
                      className="justify-start [&>span]:w-full"
                      fullWidth
                      size="field"
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
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>언제 갔나요?</DrawerTitle>
                    <DrawerDescription>하루만 갔다면 그날을, 여러 날이면 시작일과 끝날을 고르세요.</DrawerDescription>
                  </DrawerHeader>

                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
                    <Calendar
                      className="w-full rounded-xl"
                      classNames={{ root: "w-full" }}
                      defaultMonth={draftDateRange?.from ?? selectedStart}
                      fixedWeeks
                      locale={ko}
                      mode="range"
                      onSelect={setDraftDateRange}
                      selected={draftDateRange}
                    />
                  </div>

                  <DrawerFooter className="pb-[max(--spacing(4),env(safe-area-inset-bottom))]">
                    <Button
                      disabled={!draftDateRange?.from}
                      fullWidth
                      onClick={() => {
                        if (!draftDateRange?.from) return;
                        setDateRange({ from: draftDateRange.from, to: draftDateRange.to ?? draftDateRange.from });
                        setDatePickerOpen(false);
                      }}
                      size="large"
                      type="button"
                    >
                      적용
                    </Button>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
              <input name="recordedAt" type="hidden" value={recordedAt} />
              <input name="recordedUntil" type="hidden" value={recordedUntil} />
              <FieldError id="record-date-error">{fieldErrors?.recordedAt ?? fieldErrors?.recordedUntil}</FieldError>
            </Field>
          </FieldSet>

          <FieldSeparator />

          <FieldSet>
            <FieldLegend className="flex items-center gap-2" id="record-weather-label" variant="label">
              날씨
              <WeatherIcon weather={weather} className={FIELD_ICON} aria-hidden="true" />
            </FieldLegend>
            <Field data-invalid={Boolean(fieldErrors?.weather)}>
              <SegmentedControl
                aria-describedby={fieldErrors?.weather ? "record-weather-error" : undefined}
                aria-invalid={Boolean(fieldErrors?.weather)}
                aria-labelledby="record-weather-label"
                name="weather"
                onValueChange={(nextWeather) => {
                  if (!isRecordWeather(nextWeather)) return;
                  setWeather(nextWeather);
                  markDirty();
                }}
                size="large"
                value={weather}
              >
                {RECORD_WEATHER_OPTIONS.map((option) => (
                  <SegmentedControlItem key={option.value} value={option.value}>
                    {option.label}
                  </SegmentedControlItem>
                ))}
              </SegmentedControl>
              <FieldError id="record-weather-error">{fieldErrors?.weather}</FieldError>
            </Field>
          </FieldSet>

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
            <FieldLabel htmlFor="activity">무엇을 했나요?</FieldLabel>
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
              메모 <span className="font-[650] text-[11px] text-muted-foreground">(선택)</span>
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

        <Button className="mt-5" fullWidth loading={save.isPending} size="xlarge" type="submit">
          {mode === "edit" ? "수정 완료" : "기록 남기기"}
        </Button>
      </div>
    </form>
  );
}
