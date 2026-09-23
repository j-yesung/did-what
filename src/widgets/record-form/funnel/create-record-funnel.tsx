"use client";

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { useFunnel } from "@use-funnel/browser";

import { NOTIFICATIONS_QUERY_KEY } from "@/entities/notification";
import { placesQueryOptions } from "@/entities/place";
import {
  DEFAULT_RECORD_CATEGORY,
  DEFAULT_RECORD_WEATHER,
  RECORDS_QUERY_KEY,
  type RecordCategory,
  type RecordFieldErrors,
  type RecordFormState,
  type RecordWeather,
} from "@/entities/record";
import {
  RecordLocationFields,
  type RecordLocationPlace,
  type RecordLocationRegion,
} from "@/features/record/select-record-location";
import { useActionMutation } from "@/shared/lib/server-action/use-action-mutation";
import { Button } from "@/shared/ui/button";
import { FieldGroup } from "@/shared/ui/field";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { Spinner } from "@/shared/ui/spinner";

import { RecordActivityField } from "../field/activity-field";
import { RecordCategoryField } from "../field/category-field";
import { RecordDateField } from "../field/date-field";
import { RecordMemoField } from "../field/memo-field";
import { RecordWeatherField } from "../field/weather-field";
import {
  getRecordCreateErrorStep,
  getRecordCreateStepIndex,
  RECORD_CREATE_STEPS,
  type RecordCreateContext,
  type RecordCreateStep,
  type RecordCreateStepMap,
  toRecordCreateFormData,
  validateRecordCreateStep,
} from "./create-record-funnel.model";
import { RecordFunnelLayout } from "./funnel-layout";
import { useRecordCreateNavigation } from "./use-record-create-navigation";

const FUNNEL_ID = "record-create";

type RecordCreateFunnelProps = {
  action: (formData: FormData) => Promise<RecordFormState>;
  /** 장소 상세에서 시작하면 그 장소를 미리 담는다. 지역은 장소가 데려온다. */
  defaultPlace?: RecordLocationPlace;
  defaultRecordedAt: string;
  returnTo: string;
  savedTo: string;
};

export function RecordCreateFunnel(props: RecordCreateFunnelProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <RecordFunnelLayout
        backDisabled
        footer={
          <Button disabled fullWidth size="xlarge" type="button">
            다음
          </Button>
        }
        onBack={() => undefined}
        step="when"
      >
        <div className="grid min-h-48 place-items-center">
          <Spinner aria-label="작성 화면을 준비하는 중" className="text-muted-foreground" />
        </div>
      </RecordFunnelLayout>
    );
  }

  return <RecordCreateFunnelClient {...props} />;
}

function RecordCreateFunnelClient({
  action,
  defaultPlace,
  defaultRecordedAt,
  returnTo,
  savedTo,
}: RecordCreateFunnelProps) {
  const initial = useMemo(
    () => ({
      context: {
        activity: "",
        category: DEFAULT_RECORD_CATEGORY,
        dirty: false,
        memo: "",
        places: defaultPlace ? [defaultPlace] : [],
        recordedAt: defaultRecordedAt,
        recordedUntil: defaultRecordedAt,
        regions: [],
        weather: DEFAULT_RECORD_WEATHER,
      } satisfies RecordCreateContext,
      step: "when" as const,
    }),
    [defaultPlace, defaultRecordedAt],
  );
  const funnel = useFunnel<RecordCreateStepMap>({ id: FUNNEL_ID, initial });
  const [draft, setDraft] = useState<RecordCreateContext>(() => funnel.context);
  const placesQuery = useQuery(placesQueryOptions);
  const busyRef = useRef(false);
  const [fieldErrors, setFieldErrors] = useState<RecordFieldErrors>({});
  const navigation = useRecordCreateNavigation({
    busyRef,
    dirty: draft.dirty,
    fallbackHref: returnTo,
    funnelIndex: funnel.index,
  });

  const save = useActionMutation(action, {
    error: "기록을 저장하지 못했어요",
    invalidate: [RECORDS_QUERY_KEY, placesQueryOptions.queryKey, NOTIFICATIONS_QUERY_KEY],
    success: "함께한 순간을 기록했어요",
    onSuccess: () => navigation.finish(savedTo),
    onFail: (result) => {
      const nextErrors = result.fieldErrors ?? {};
      const errorStep = getRecordCreateErrorStep(nextErrors);
      setFieldErrors(nextErrors);
      if (errorStep && errorStep !== funnel.step) void funnel.history.replace(errorStep, draft);
    },
  });
  const busy = save.isPending;
  busyRef.current = busy;

  const updateContext = (patch: Partial<RecordCreateContext>) => {
    const next = { ...draft, ...patch, dirty: true };
    setFieldErrors({});
    setDraft(next);
    void funnel.history.replace(funnel.step, next);
  };

  const goNext = () => {
    const errors = validateRecordCreateStep(funnel.step, draft);
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    const next = RECORD_CREATE_STEPS[getRecordCreateStepIndex(funnel.step) + 1];
    if (next) void funnel.history.push(next, draft);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors = validateRecordCreateStep("what", draft);
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    const formData = toRecordCreateFormData(draft);
    save.mutate(formData);
  };

  const renderStep = (step: RecordCreateStep) => {
    if (step === "when") {
      return (
        <FieldGroup className="gap-0">
          <RecordDateField
            defaultRecordedAt={defaultRecordedAt}
            initialRecordedAt={draft.recordedAt}
            initialRecordedUntil={draft.recordedUntil}
            onValueChange={(recordedAt, recordedUntil) => updateContext({ recordedAt, recordedUntil })}
            recordedAtError={fieldErrors.recordedAt}
            recordedUntilError={fieldErrors.recordedUntil}
          />
          <div style={{ paddingTop: "2.5rem" }}>
            <RecordWeatherField
              initialWeather={draft.weather}
              onChange={(weather: RecordWeather) => updateContext({ weather })}
              weatherError={fieldErrors.weather}
            />
          </div>
        </FieldGroup>
      );
    }

    if (step === "where") {
      if (placesQuery.isPending) {
        return (
          <div className="grid min-h-48 place-items-center">
            <Spinner aria-label="장소 선택지를 불러오는 중" className="text-muted-foreground" />
          </div>
        );
      }

      if (placesQuery.isError) {
        return (
          <LoadErrorAlert
            onRetry={() => void placesQuery.refetch()}
            retrying={placesQuery.isFetching}
            title="선택지를 불러오지 못했어요"
          />
        );
      }

      return (
        <FieldGroup className="gap-10">
          <RecordLocationFields
            initialPlaces={draft.places}
            initialRegions={draft.regions}
            onValueChange={(regions: RecordLocationRegion[], places: RecordLocationPlace[]) =>
              updateContext({ places, regions })
            }
            placeError={fieldErrors.places}
            regionError={fieldErrors.regions}
            savedPlaces={placesQuery.data}
          />
        </FieldGroup>
      );
    }

    return (
      <FieldGroup className="gap-10">
        {/* 키보드가 올라오면 아래가 가려서, 한 번 탭으로 끝나는 선택을 맨 앞에 둔다. */}
        <RecordCategoryField
          categoryError={fieldErrors.category}
          initialCategory={draft.category}
          onChange={(category: RecordCategory) => updateContext({ category })}
        />
        <RecordActivityField activityError={fieldErrors.activity} initialActivity={draft.activity} />
        <RecordMemoField initialMemo={draft.memo} memoError={fieldErrors.memo} />
      </FieldGroup>
    );
  };

  const nextDisabled = busy || (funnel.step === "where" && !placesQuery.isSuccess);

  return (
    <form
      className="contents"
      id="record-form"
      onChange={(event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
        if (target.name === "activity") updateContext({ activity: target.value });
        if (target.name === "memo") updateContext({ memo: target.value });
      }}
      onSubmit={submit}
    >
      {navigation.confirmDialog}
      <RecordFunnelLayout
        backDisabled={busy}
        footer={
          <Button
            disabled={nextDisabled}
            fullWidth
            loading={busy}
            onClick={
              funnel.step === "what"
                ? undefined
                : (event) => {
                    event.preventDefault();
                    goNext();
                  }
            }
            size="xlarge"
            type={funnel.step === "what" ? "submit" : "button"}
          >
            {funnel.step === "what" ? "기록 남기기" : "다음"}
          </Button>
        }
        onBack={funnel.step === "when" ? navigation.exit : () => void funnel.history.back()}
        step={funnel.step}
      >
        {renderStep(funnel.step)}
      </RecordFunnelLayout>
    </form>
  );
}
