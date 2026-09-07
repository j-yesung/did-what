"use client";

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { MapPinCheckIcon } from "@animateicons/react/lucide";
import { useQuery } from "@tanstack/react-query";
import { useFunnel } from "@use-funnel/browser";

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
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { Spinner } from "@/shared/ui/spinner";

import {
  getRecordCreateErrorStep,
  type RecordCreateContext,
  type RecordCreateStep,
  type RecordCreateStepMap,
  toRecordCreateFormData,
  validateRecordCreateStep,
} from "./create-record-funnel.model";
import { RecordDateField } from "./date-field";
import { RecordFunnelLayout } from "./funnel-layout";
import { RecordTextFields } from "./text-fields";
import { useRecordCreateNavigation } from "./use-record-create-navigation";
import { RecordWeatherField } from "./weather-field";

const FUNNEL_ID = "record-create";

type RecordFormState = {
  fieldErrors?: RecordFieldErrors;
  message?: string;
  status: "error" | "success";
};

type RecordCreateFunnelProps = {
  action: (formData: FormData) => Promise<RecordFormState>;
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

function RecordCreateFunnelClient({ action, defaultRecordedAt, returnTo, savedTo }: RecordCreateFunnelProps) {
  const initial = useMemo(
    () => ({
      context: {
        activity: "",
        dirty: false,
        memo: "",
        places: [],
        recordedAt: defaultRecordedAt,
        recordedUntil: defaultRecordedAt,
        region: null,
        weather: null,
      } satisfies RecordCreateContext,
      step: "when" as const,
    }),
    [defaultRecordedAt],
  );
  const funnel = useFunnel<RecordCreateStepMap>({ id: FUNNEL_ID, initial });
  const [draft, setDraft] = useState<RecordCreateContext>(() => funnel.context);
  const placesQuery = useQuery(placesQueryOptions);
  const busyRef = useRef(false);
  const [fieldErrors, setFieldErrors] = useState<RecordFieldErrors>({});
  const [focusInvalidKey, setFocusInvalidKey] = useState(0);
  const [preparing, setPreparing] = useState(false);
  const navigation = useRecordCreateNavigation({
    busyRef,
    dirty: draft.dirty,
    fallbackHref: returnTo,
    funnelIndex: funnel.index,
  });

  const save = useActionMutation(action, {
    error: "기록을 저장하지 못했어요",
    icon: MapPinCheckIcon,
    invalidate: [RECORDS_QUERY_KEY, placesQueryOptions.queryKey],
    success: "기록을 남겼어요",
    onSuccess: () => navigation.finish(savedTo),
    onFail: (result) => {
      const nextErrors = result.fieldErrors ?? {};
      const errorStep = getRecordCreateErrorStep(nextErrors);
      setFieldErrors(nextErrors);
      setFocusInvalidKey((current) => current + 1);
      if (errorStep && errorStep !== funnel.step) void funnel.history.replace(errorStep, draft);
    },
  });
  const busy = preparing || save.isPending;
  busyRef.current = busy;

  function updateContext(patch: Partial<RecordCreateContext>) {
    setFieldErrors({});
    setDraft((current) => {
      const next = { ...current, ...patch, dirty: true };
      void funnel.history.replace(funnel.step, next);
      return next;
    });
  }

  function focusErrors(errors: RecordFieldErrors) {
    setFieldErrors(errors);
    setFocusInvalidKey((current) => current + 1);
  }

  function goNext() {
    const errors = validateRecordCreateStep(funnel.step, draft);
    if (Object.keys(errors).length) {
      focusErrors(errors);
      return;
    }

    const nextStep: Record<RecordCreateStep, RecordCreateStep | null> = {
      when: "where",
      where: "what",
      what: null,
    };
    const next = nextStep[funnel.step];
    if (next) void funnel.history.push(next, draft);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateRecordCreateStep("what", draft);
    if (Object.keys(errors).length) {
      focusErrors(errors);
      return;
    }

    setPreparing(true);
    const formData = toRecordCreateFormData(draft);
    const endpoint = await getPushEndpoint();
    if (endpoint) formData.set("senderEndpoint", endpoint);
    setPreparing(false);
    save.mutate(formData);
  }

  function renderStep(step: RecordCreateStep) {
    if (step === "when") {
      return (
        <FieldGroup className="gap-7">
          <RecordDateField
            defaultRecordedAt={defaultRecordedAt}
            initialRecordedAt={draft.recordedAt}
            initialRecordedUntil={draft.recordedUntil}
            onValueChange={(recordedAt, recordedUntil) => updateContext({ recordedAt, recordedUntil })}
            recordedAtError={fieldErrors.recordedAt}
            recordedUntilError={fieldErrors.recordedUntil}
          />
          <FieldSeparator />
          <RecordWeatherField
            initialWeather={draft.weather}
            onChange={(weather: RecordWeather) => updateContext({ weather })}
            weatherError={fieldErrors.weather}
          />
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

      if (placesQuery.isError) return <LoadErrorAlert title="선택지를 불러오지 못했어요" />;

      return (
        <FieldGroup className="gap-7">
          <RecordLocationFields
            initialPlaces={draft.places}
            initialRegion={draft.region ?? undefined}
            onValueChange={(region: RecordLocationRegion | null, places: RecordLocationPlace[]) =>
              updateContext({ places, region })
            }
            placeError={fieldErrors.places}
            regionError={fieldErrors.regionCode}
            savedPlaces={placesQuery.data}
          />
        </FieldGroup>
      );
    }

    return (
      <FieldGroup className="gap-7">
        <RecordTextFields
          activityError={fieldErrors.activity}
          initialActivity={draft.activity}
          initialMemo={draft.memo}
          memoError={fieldErrors.memo}
        />
      </FieldGroup>
    );
  }

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
        focusInvalidKey={focusInvalidKey}
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
