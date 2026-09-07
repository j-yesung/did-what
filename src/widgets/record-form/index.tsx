"use client";

import type { SubmitEvent } from "react";
import { useEffect, useRef } from "react";

import { MapPinCheckIcon, PencilIcon } from "@animateicons/react/lucide";
import { useQuery } from "@tanstack/react-query";

import { placesQueryOptions } from "@/entities/place";
import { RECORDS_QUERY_KEY, type RecordFieldErrors, type RecordWeather } from "@/entities/record";
import { getPushEndpoint } from "@/features/push-notification";
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

import { RecordDateField } from "./date-field";
import { RecordTextFields } from "./text-fields";
import { RecordWeatherField } from "./weather-field";

export { RecordCreateFunnel } from "./create-record-funnel";

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
  const formRef = useRef<HTMLFormElement>(null);

  const save = useActionMutation(action, {
    error: `기록을 ${mode === "edit" ? "수정" : "저장"}하지 못했어요`,
    icon: mode === "edit" ? PencilIcon : MapPinCheckIcon,
    invalidate: [RECORDS_QUERY_KEY, placesQueryOptions.queryKey],
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

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
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
          <RecordDateField
            defaultRecordedAt={defaultRecordedAt}
            initialRecordedAt={initialValues?.recordedAt}
            initialRecordedUntil={initialValues?.recordedUntil}
            recordedAtError={fieldErrors?.recordedAt}
            recordedUntilError={fieldErrors?.recordedUntil}
          />

          <FieldSeparator />

          <RecordWeatherField
            initialWeather={initialValues?.weather}
            onChange={markDirty}
            weatherError={fieldErrors?.weather}
          />

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

          <RecordTextFields
            activityError={fieldErrors?.activity}
            initialActivity={initialValues?.activity}
            initialMemo={initialValues?.memo}
            memoError={fieldErrors?.memo}
          />
        </FieldGroup>

        <Button className="mt-5" fullWidth loading={save.isPending} size="xlarge" type="submit">
          {mode === "edit" ? "수정 완료" : "기록 남기기"}
        </Button>
      </div>
    </form>
  );
}
