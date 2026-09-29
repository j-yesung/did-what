"use client";

import type { SubmitEvent } from "react";
import { useEffect, useRef, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { placesQueryOptions, type SavedPlaceRow } from "@/entities/place";
import {
  RECORDS_QUERY_KEY,
  type RecordCategory,
  type RecordFieldErrors,
  type RecordFormState,
  type RecordWeather,
  readRecordInput,
  validateRecordInput,
} from "@/entities/record";
import {
  RecordLocationFields,
  type RecordLocationPlace,
  type RecordLocationRegion,
} from "@/features/record/select-record-location";
import { useActionMutation } from "@/shared/lib/server-action/use-action-mutation";
import { Button } from "@/shared/ui/button";
import { FieldGroup, FieldSeparator } from "@/shared/ui/field";
import type { LeaveGuardHandle } from "@/shared/ui/leave-guard";
import { LeaveGuard } from "@/shared/ui/leave-guard";

import { RecordActivityField } from "./field/activity-field";
import { RecordCategoryField } from "./field/category-field";
import { RecordDateField } from "./field/date-field";
import { RecordMemoField } from "./field/memo-field";
import { RecordWeatherField } from "./field/weather-field";

type RecordEditFormProps = {
  action: (formData: FormData) => Promise<RecordFormState>;
  initialValues: {
    activity: string;
    category: RecordCategory;
    memo: string;
    places: RecordLocationPlace[];
    recordedAt: string;
    recordedUntil: string | null;
    regions: RecordLocationRegion[];
    weather: RecordWeather;
  };
  initialSavedPlaces?: SavedPlaceRow[];
  returnTo: string;
  savedTo: string;
};

export function RecordEditForm({ action, initialSavedPlaces, initialValues, returnTo, savedTo }: RecordEditFormProps) {
  const guardRef = useRef<LeaveGuardHandle>(null);
  const placesQuery = useQuery({ ...placesQueryOptions, initialData: initialSavedPlaces });
  const formRef = useRef<HTMLFormElement>(null);
  const [clientErrors, setClientErrors] = useState<RecordFieldErrors>();
  // 오류가 화면에 그려진 다음에 첫 오류 필드로 옮겨야 해서, 실패할 때마다 값을 바꿔 효과를 다시 부른다.
  const [errorFocusKey, setErrorFocusKey] = useState(0);

  const save = useActionMutation(action, {
    error: "기록을 수정하지 못했어요",
    invalidate: [RECORDS_QUERY_KEY, placesQueryOptions.queryKey],
    success: "기록을 수정했어요",
    onSuccess: () => {
      if (formRef.current) formRef.current.dataset.dirty = "false";
      guardRef.current?.finish(savedTo);
    },
    onFail: () => setErrorFocusKey((key) => key + 1),
  });

  const fieldErrors = clientErrors ?? save.data?.fieldErrors;

  useEffect(() => {
    if (errorFocusKey === 0) return;
    const invalid = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    invalid?.scrollIntoView({ behavior: "smooth", block: "center" });
    invalid?.focus({ preventScroll: true });
  }, [errorFocusKey]);

  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (formRef.current?.dataset.dirty !== "true") return;

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, []);

  const markDirty = () => {
    if (formRef.current) formRef.current.dataset.dirty = "true";
    // 고치기 시작하면 앞서 막았던 오류 표시는 지운다. 작성 과정도 같은 방식이다.
    if (clientErrors) setClientErrors(undefined);
  };

  // 서버와 같은 검증을 먼저 돌려, 긴 폼 맨 아래에서 눌러도 무엇이 틀렸는지 바로 보여준다.
  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const { fieldErrors: nextErrors } = validateRecordInput(readRecordInput(formData));
    setClientErrors(nextErrors);
    if (nextErrors) {
      setErrorFocusKey((key) => key + 1);
      return;
    }

    save.mutate(formData);
  };

  // 저장한 장소를 아직 못 받았으면 '내 장소에서 추가'만 잠시 꺼 두고 나머지 폼은 그대로 쓴다.
  const savedPlaces = placesQuery.data ?? [];

  return (
    <form
      ref={formRef}
      className="flex flex-col gap-4"
      data-dirty="false"
      id="record-form"
      noValidate
      onChange={markDirty}
      onSubmit={handleSubmit}
    >
      <LeaveGuard fallbackHref={returnTo} isDirty={() => formRef.current?.dataset.dirty === "true"} ref={guardRef} />
      <div className="px-1 py-1">
        <FieldGroup>
          <RecordDateField
            defaultRecordedAt={initialValues.recordedAt}
            initialRecordedUntil={initialValues.recordedUntil}
            onValueChange={markDirty}
            recordedAtError={fieldErrors?.recordedAt}
            recordedUntilError={fieldErrors?.recordedUntil}
          />

          <FieldSeparator />

          <RecordWeatherField
            initialWeather={initialValues.weather}
            onChange={markDirty}
            weatherError={fieldErrors?.weather}
          />

          <FieldSeparator />

          <RecordLocationFields
            initialPlaces={initialValues.places}
            initialRegions={initialValues.regions}
            onValueChange={markDirty}
            placeError={fieldErrors?.places}
            regionError={fieldErrors?.regions}
            savedPlaces={savedPlaces}
          />

          <FieldSeparator />

          <RecordCategoryField
            categoryError={fieldErrors?.category}
            initialCategory={initialValues.category}
            onChange={markDirty}
          />

          <FieldSeparator />

          <RecordActivityField activityError={fieldErrors?.activity} initialActivity={initialValues.activity} />

          <FieldSeparator />

          <RecordMemoField initialMemo={initialValues.memo} memoError={fieldErrors?.memo} />
        </FieldGroup>

        <Button className="mt-5" fullWidth loading={save.isPending} size="xlarge" type="submit">
          수정 완료
        </Button>
      </div>
    </form>
  );
}
