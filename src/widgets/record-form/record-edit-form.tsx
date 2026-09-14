"use client";

import type { SubmitEvent } from "react";
import { useEffect, useRef } from "react";

import { PencilIcon } from "@animateicons/react/lucide";
import { useQuery } from "@tanstack/react-query";

import { placesQueryOptions } from "@/entities/place";
import { RECORDS_QUERY_KEY, type RecordFormState, type RecordWeather } from "@/entities/record";
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
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { Spinner } from "@/shared/ui/spinner";

import { RecordDateField } from "./field/date-field";
import { RecordTextFields } from "./field/text-fields";
import { RecordWeatherField } from "./field/weather-field";

type RecordEditFormProps = {
  action: (formData: FormData) => Promise<RecordFormState>;
  initialValues: {
    activity: string;
    memo: string;
    places: RecordLocationPlace[];
    recordedAt: string;
    recordedUntil: string | null;
    region: RecordLocationRegion;
    weather: RecordWeather;
  };
  returnTo: string;
  savedTo: string;
};

export function RecordEditForm({ action, initialValues, returnTo, savedTo }: RecordEditFormProps) {
  const guardRef = useRef<LeaveGuardHandle>(null);
  const placesQuery = useQuery(placesQueryOptions);
  const formRef = useRef<HTMLFormElement>(null);

  const save = useActionMutation(action, {
    error: "기록을 수정하지 못했어요",
    icon: PencilIcon,
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
            initialRegion={initialValues.region}
            onValueChange={markDirty}
            placeError={fieldErrors?.places}
            regionError={fieldErrors?.regionCode}
            savedPlaces={savedPlaces}
          />

          <FieldSeparator />

          <RecordTextFields
            activityError={fieldErrors?.activity}
            initialActivity={initialValues.activity}
            initialMemo={initialValues.memo}
            memoError={fieldErrors?.memo}
          />
        </FieldGroup>

        <Button className="mt-5" fullWidth loading={save.isPending} size="xlarge" type="submit">
          수정 완료
        </Button>
      </div>
    </form>
  );
}
