"use client";

import type { SubmitEvent } from "react";
import { useEffect, useRef } from "react";

import { useQuery } from "@tanstack/react-query";

import { placesQueryOptions, type SavedPlaceRow } from "@/entities/place";
import { RECORDS_QUERY_KEY, type RecordCategory, type RecordFormState, type RecordWeather } from "@/entities/record";
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

  const save = useActionMutation(action, {
    error: "기록을 수정하지 못했어요",
    invalidate: [RECORDS_QUERY_KEY, placesQueryOptions.queryKey],
    success: "기록을 수정했어요",
    onSuccess: () => {
      if (formRef.current) formRef.current.dataset.dirty = "false";
      guardRef.current?.finish(savedTo);
    },
    onFail: () => {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    },
  });

  const fieldErrors = save.data?.fieldErrors;

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
  };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    save.mutate(new FormData(event.currentTarget));
  };

  // 저장한 장소를 아직 못 받았으면 '내 장소에서 추가'만 잠시 꺼 두고 나머지 폼은 그대로 쓴다.
  const savedPlaces = placesQuery.data ?? [];

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
