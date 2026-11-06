"use client";

import { type Dispatch, type ReactNode, type SetStateAction, useEffect, useState } from "react";

import { DotsThreeVerticalIcon, NotePencilIcon, PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";

import { RecordDetailHeader, recordDetailQueryOptions } from "@/entities/record";
import { DeleteRecordConfirm } from "@/features/record/delete-record/ui/delete-record-confirm";
import { RecordComments } from "@/features/record-comment/ui/record-comments";
import { cn } from "@/shared/lib/utils";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { LiquidGlassMenu } from "@/shared/ui/liquid-glass/menu/liquid-glass-menu";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { Spinner } from "@/shared/ui/spinner";

import { RecordDetailSections } from "./record-detail-sections";

type RecordSheetDetailProps = {
  action?: ReactNode;
  draft: string;
  member: { id: string; name: string };
  onDeleted: () => void;
  onMissing?: () => void;
  onDraftChange: Dispatch<SetStateAction<string>>;
  recordId: string;
};

export function RecordSheetDetail({
  action,
  draft,
  member,
  onDeleted,
  onMissing,
  onDraftChange,
  recordId,
}: RecordSheetDetailProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  const recordQuery = useQuery(recordDetailQueryOptions(recordId));
  const record = recordQuery.data;

  useEffect(() => {
    if (recordQuery.isSuccess && !recordQuery.isFetching && !record) onMissing?.();
  }, [recordQuery.isSuccess, recordQuery.isFetching, record, onMissing]);

  return (
    <div className="group/sheet-detail relative flex min-h-0 flex-1 flex-col">
      <div className="pointer-events-none absolute inset-x-5 top-7 z-20 flex items-center justify-end [&>*]:pointer-events-auto">
        {record ? (
          <LiquidGlassMenu
            label="기록 작업"
            icon={DotsThreeVerticalIcon}
            actions={[
              { label: "수정하기", icon: PencilSimpleIcon, href: `/records/${recordId}/edit` },
              {
                label: "삭제하기",
                icon: TrashIcon,
                onSelect: () => setDeleteOpen(true),
                destructive: true,
              },
            ]}
          />
        ) : null}
      </div>
      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overscroll-contain",
          action
            ? "pb-[calc(--spacing(26)+env(safe-area-inset-bottom))]"
            : "pb-[calc(--spacing(5)+env(safe-area-inset-bottom))]",
        )}
      >
        <BottomSheet.Header className="pt-7 text-left" glass>
          <BottomSheet.Title className="sr-only">{record?.activity ?? "기록 상세"}</BottomSheet.Title>
        </BottomSheet.Header>
        <div aria-hidden="true" className="h-(--toolbar-height)" />
        <div className="px-6 pt-6">
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
            <div className="flex flex-col gap-11">
              <RecordDetailHeader record={record} titleId="sheet-record-activity-title" />
              <RecordDetailSections memo={record.memo} places={record.record_places} />
              <RecordComments
                count={record.record_comments?.[0]?.count ?? 0}
                draft={draft}
                member={member}
                onDraftChange={onDraftChange}
                recordId={record.id}
              />
            </div>
          ) : (
            <div className="flex justify-center py-12">
              <Spinner aria-label="기록을 불러오는 중" />
            </div>
          )}
        </div>
      </div>
      {action ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-[linear-gradient(transparent,var(--color-surface)_32px)] px-5 pt-8 pb-[calc(--spacing(4)+env(safe-area-inset-bottom))] group-has-[textarea:focus]/sheet-detail:hidden [&>*]:pointer-events-auto">
          {action}
        </div>
      ) : null}
      <DeleteRecordConfirm
        activity={record?.activity ?? ""}
        onClose={() => setDeleteOpen(false)}
        onDeleted={onDeleted}
        open={deleteOpen}
        recordId={recordId}
      />
    </div>
  );
}
