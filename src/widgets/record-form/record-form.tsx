"use client";

import { type SubmitEvent, useRef, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { NOTIFICATIONS_QUERY_KEY } from "@/entities/notification";
import { placesQueryOptions } from "@/entities/place";
import {
  RECORDS_QUERY_KEY,
  type RecordFieldErrors,
  type RecordFormState,
  readRecordInput,
  validateRecordInput,
} from "@/entities/record";
import { createPlacePickerDraft, RecordLocationFields } from "@/features/record/select-record-location";
import { getToday } from "@/shared/lib/date/get-today";
import { useLeaveGuard } from "@/shared/lib/navigation/use-leave-guard";
import { useActionMutation } from "@/shared/lib/server-action/use-action-mutation";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { FieldGroup } from "@/shared/ui/field";
import { LeaveConfirmDialog } from "@/shared/ui/leave-confirm-dialog";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { Spinner } from "@/shared/ui/spinner";

import { RecordDateField } from "./field/date-field";
import { RecordMemoField } from "./field/memo-field";
import {
  getErrorSlots,
  getRecordFormHint,
  hasRecordLocation,
  isRecordDraftReady,
  type RecordFormDraft,
  type RecordFormSlot,
  toRecordFormData,
} from "./model/record-form-draft";
import { RecordFormLayout } from "./ui/record-form-layout";
import { RecordFormSheet } from "./ui/record-form-sheet";
import { RecordSentence } from "./ui/record-sentence";

const COPY = {
  create: { error: "기록을 저장하지 못했어요", submit: "기록 남기기", success: "함께한 순간을 기록했어요" },
  edit: { error: "기록을 수정하지 못했어요", submit: "수정하기", success: "기록을 수정했어요" },
};

type OpenSlot = Exclude<RecordFormSlot, "activity" | "weather">;

type RecordFormProps = {
  action: (formData: FormData) => Promise<RecordFormState>;
  initialValues: RecordFormDraft;
  mode: "create" | "edit";
  fallbackHref: string;
  savedTo: string;
  searchRegionName?: string;
};

export function RecordForm({ action, fallbackHref, initialValues, mode, savedTo, searchRegionName }: RecordFormProps) {
  const copy = COPY[mode];
  const [draft, setDraft] = useState(initialValues);
  const [dirty, setDirty] = useState(false);
  const [pickerDraft, setPickerDraft] = useState(createPlacePickerDraft);
  const [openSlot, setOpenSlot] = useState<OpenSlot | null>(null);
  const [guiding, setGuiding] = useState(mode === "create");
  const [categorySeen, setCategorySeen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<RecordFieldErrors>({});
  const [shakeKey, setShakeKey] = useState(0);
  const activityRef = useRef<HTMLTextAreaElement>(null);
  const focusAfterClose = useRef<"activity" | "stay" | null>(null);
  const placesQuery = useQuery(placesQueryOptions);

  const showErrors = (errors: RecordFieldErrors) => {
    setFieldErrors(errors);
    setShakeKey((key) => key + 1);
  };

  const save = useActionMutation(action, {
    error: copy.error,
    invalidate:
      mode === "create"
        ? [RECORDS_QUERY_KEY, placesQueryOptions.queryKey, NOTIFICATIONS_QUERY_KEY]
        : [RECORDS_QUERY_KEY, placesQueryOptions.queryKey],
    success: copy.success,
    waitForRouter: true,
    onSuccess: () => navigation.finish(savedTo),
    onFail: (result) => showErrors(result.fieldErrors ?? {}),
  });
  const busy = save.isPending || save.data?.status === "success";
  const navigation = useLeaveGuard({
    busy,
    fallbackHref,
    isDirty: () => dirty || pickerDraft.selectedPlaces.size > 0 || pickerDraft.selectedRegions.size > 0,
  });

  const update = (patch: Partial<RecordFormDraft>) => {
    setFieldErrors({});
    setDraft((current) => ({ ...current, ...patch }));
    setDirty(true);
  };

  const closeSlot = (closing: OpenSlot) => {
    if (closing === "category") setCategorySeen(true);
    const guided = closing === "where" || closing === "category";
    if (!guiding || !guided || !hasRecordLocation(draft)) {
      setOpenSlot(null);
      return;
    }

    if (closing === "where" && !categorySeen) {
      focusAfterClose.current = "stay";
      setOpenSlot("category");
      return;
    }

    setOpenSlot(null);
    setGuiding(false);
    focusAfterClose.current = draft.activity.trim() ? null : "activity";
  };

  const finalFocus = () => {
    const target = focusAfterClose.current;
    focusAfterClose.current = null;
    if (target === "stay") return false;
    if (target !== "activity") return true;
    return activityRef.current ?? true;
  };

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;

    const formData = toRecordFormData(draft);
    const { fieldErrors: errors } = validateRecordInput(readRecordInput(formData));
    if (errors) {
      showErrors(errors);
      return;
    }

    save.mutate(formData);
  };

  const ready = isRecordDraftReady(draft);
  const errorSlots = getErrorSlots(fieldErrors);
  const errorHint = getRecordFormHint(draft, fieldErrors);

  return (
    <>
      <form
        className="contents"
        id="record-form"
        noValidate
        onChange={(event) => {
          const target = event.target;
          if (target instanceof HTMLTextAreaElement && target.name === "memo") update({ memo: target.value });
        }}
        onSubmit={submit}
      >
        <LeaveConfirmDialog onLeave={navigation.confirmLeave} onStay={navigation.stay} open={navigation.confirmOpen} />
        <RecordFormLayout
          backDisabled={busy}
          footer={
            <Button
              aria-disabled={!ready || undefined}
              className={cn(!ready && "opacity-50")}
              fullWidth
              loading={busy}
              size="xlarge"
              type="submit"
            >
              {copy.submit}
            </Button>
          }
          onBack={navigation.exit}
          title={mode === "create" ? "기록 남기기" : "기록 수정"}
        >
          <RecordSentence
            activityRef={activityRef}
            draft={draft}
            errorSlots={errorSlots}
            hint={errorHint}
            onActivityChange={(activity) => update({ activity })}
            categoryFinalFocus={finalFocus}
            categoryOpen={openSlot === "category"}
            onCategoryChange={(category) => update({ category })}
            onCategoryOpenChange={(open) => (open ? setOpenSlot("category") : closeSlot("category"))}
            onOpen={setOpenSlot}
            onWeatherChange={(weather) => update({ weather })}
            shakeKey={shakeKey}
            today={getToday()}
          />

          <div className="mt-8">
            <RecordMemoField initialMemo={draft.memo} memoError={fieldErrors.memo} />
          </div>
        </RecordFormLayout>
      </form>

      <RecordFormSheet
        finalFocus={finalFocus}
        onClose={() => closeSlot("date")}
        open={openSlot === "date"}
        title="언제였나요?"
      >
        <RecordDateField
          initialRecordedAt={draft.recordedAt}
          initialRecordedUntil={draft.recordedUntil}
          onValueChange={(recordedAt, recordedUntil) => update({ recordedAt, recordedUntil })}
          recordedAtError={fieldErrors.recordedAt}
          recordedUntilError={fieldErrors.recordedUntil}
        />
      </RecordFormSheet>

      <RecordFormSheet
        finalFocus={finalFocus}
        onClose={() => closeSlot("where")}
        open={openSlot === "where"}
        title="어디서 보냈나요?"
      >
        {placesQuery.isPending ? (
          <div className="grid min-h-48 place-items-center">
            <Spinner aria-label="장소 선택지를 불러오는 중" className="text-muted-foreground" />
          </div>
        ) : placesQuery.isError ? (
          <LoadErrorAlert
            onRetry={() => void placesQuery.refetch()}
            retrying={placesQuery.isFetching}
            title="선택지를 불러오지 못했어요"
          />
        ) : (
          <FieldGroup className="gap-10">
            <RecordLocationFields
              initialPlaces={draft.places}
              initialRegions={draft.regions}
              onPickerDraftChange={setPickerDraft}
              onValueChange={(regions, places) => update({ places, regions })}
              pickerDraft={pickerDraft}
              placeError={fieldErrors.places}
              regionError={fieldErrors.regions}
              savedPlaces={placesQuery.data}
              searchRegionName={searchRegionName}
            />
          </FieldGroup>
        )}
      </RecordFormSheet>
    </>
  );
}
