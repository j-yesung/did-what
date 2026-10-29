"use client";

import { type Dispatch, type SetStateAction, useState } from "react";

import { DotsThreeVerticalIcon, NotePencilIcon, PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";

import { formatRecordRegionLabels, RecordDetailHeader, recordDetailQueryOptions } from "@/entities/record";
import { DeleteRecordConfirm } from "@/features/record/delete-record";
import { RecordComments } from "@/features/record-comment";
import { BackButton } from "@/shared/ui/back-button";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { MorphMenu } from "@/shared/ui/morph-menu";
import { Spinner } from "@/shared/ui/spinner";

import { RecordDetailSections } from "./record-detail-sections";

type RecordSheetDetailProps = {
  backLabel?: string;
  confirmClassName?: string;
  draft: string;
  member: { id: string; name: string };
  onBack: () => void;
  onDeleted?: () => void;
  onDraftChange: Dispatch<SetStateAction<string>>;
  recordId: string;
};

export function RecordSheetDetail({
  backLabel = "이전 화면으로",
  confirmClassName,
  draft,
  member,
  onBack,
  onDeleted = onBack,
  onDraftChange,
  recordId,
}: RecordSheetDetailProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const recordQuery = useQuery(recordDetailQueryOptions(recordId));
  const record = recordQuery.data;
  const regionText = record ? formatRecordRegionLabels(record, Number.POSITIVE_INFINITY) : "";

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="pointer-events-none absolute inset-x-5 top-7 z-20 flex items-center justify-between gap-3 [&>*]:pointer-events-auto">
        <BackButton aria-label={backLabel} onClick={onBack} />
        {record ? (
          <MorphMenu
            label="기록 작업"
            moreIcon={DotsThreeVerticalIcon}
            actions={[
              { label: "수정하기", icon: PencilSimpleIcon, href: `/records/${recordId}/edit` },
              {
                label: "삭제하기",
                icon: TrashIcon,
                onSelect: () => setDeleteOpen(true),
                className: "text-destructive",
              },
            ]}
          />
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[calc(--spacing(5)+env(safe-area-inset-bottom))]">
        <BottomSheet.Header className="pt-7 text-left" glass>
          <BottomSheet.Title className="sr-only">{record?.activity ?? "기록 상세"}</BottomSheet.Title>
        </BottomSheet.Header>
        <div aria-hidden="true" className="h-(--toolbar-height)" />
        <div className="px-5 pt-6">
          {recordQuery.isSuccess && !record ? (
            <LoadErrorAlert icon={<NotePencilIcon aria-hidden="true" />} title="기록을 찾을 수 없어요" />
          ) : recordQuery.isError ? (
            <LoadErrorAlert
              icon={<NotePencilIcon aria-hidden="true" />}
              onRetry={() => void recordQuery.refetch()}
              retrying={recordQuery.isFetching}
              title="기록을 불러오지 못했어요"
            />
          ) : record ? (
            <div className="flex flex-col gap-5">
              <section aria-labelledby="sheet-record-activity-title">
                <RecordDetailHeader record={record} regionText={regionText} titleId="sheet-record-activity-title" />
              </section>

              <RecordDetailSections
                heading="h3"
                idPrefix="sheet-record"
                memo={record.memo}
                places={record.record_places}
              />

              <RecordComments draft={draft} member={member} onDraftChange={onDraftChange} recordId={record.id} />
            </div>
          ) : (
            <div className="flex justify-center py-12">
              <Spinner aria-label="기록을 불러오는 중" />
            </div>
          )}
        </div>
      </div>
      <DeleteRecordConfirm
        activity={record?.activity ?? ""}
        className={confirmClassName}
        onClose={() => setDeleteOpen(false)}
        onDeleted={onDeleted}
        open={deleteOpen}
        recordId={recordId}
      />
    </div>
  );
}
