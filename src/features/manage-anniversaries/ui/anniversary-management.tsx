"use client";

import { type ReactNode, useState } from "react";

import { TrashIcon } from "@phosphor-icons/react";

import type { Anniversary, AnniversaryActionResult, AnniversaryDraft } from "@/entities/anniversary/model/types";
import { formatMonthDay } from "@/shared/lib/date/format-date";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog, ConfirmDialogCancelButton } from "@/shared/ui/confirm-dialog";
import { Empty, EmptyHeader, EmptyTitle } from "@/shared/ui/empty";
import { IconButton } from "@/shared/ui/icon-button";
import { ListRowTexts } from "@/shared/ui/list-row";

import { AnniversarySheet } from "./anniversary-sheet";

type AnniversaryManagementProps = {
  anniversaries: readonly Anniversary[];
  today: string;
  renderListLabel?: (anniversary: Anniversary) => ReactNode;
  formStyle?: "night" | "date" | "line";
  onCreate: (anniversary: AnniversaryDraft) => Promise<AnniversaryActionResult>;
  onDelete: (id: string) => Promise<AnniversaryActionResult>;
};

export function AnniversaryManagement({
  anniversaries,
  today,
  renderListLabel,
  formStyle,
  onCreate,
  onDelete,
}: AnniversaryManagementProps) {
  const [removal, setRemoval] = useState<{ anniversary: Anniversary; open: boolean } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const closeRemoval = () => setRemoval((current) => (current?.open ? { ...current, open: false } : current));

  const remove = async () => {
    if (!removal?.open || deleting) return;
    setDeleting(true);
    setError("");
    try {
      const result = await onDelete(removal.anniversary.id);
      if (result.status === "error") setError(result.message ?? "기념일을 삭제하지 못했어요.");
      else closeRemoval();
    } catch {
      setError("기념일을 삭제하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {anniversaries.length === 0 ? (
        <Empty className="py-9">
          <EmptyHeader>
            <EmptyTitle className="text-muted-foreground">아직 등록한 기념일이 없어요</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="divide-y divide-border">
          {anniversaries.map((anniversary) => (
            <li className="flex items-center gap-3 py-1" key={anniversary.id}>
              {renderListLabel ? (
                renderListLabel(anniversary)
              ) : (
                <ListRowTexts
                  className="flex-1"
                  description={<time dateTime={anniversary.date.slice(5)}>{formatMonthDay(anniversary.date)}</time>}
                  title={anniversary.name}
                />
              )}
              <IconButton
                aria-label={`${anniversary.name} 삭제`}
                className="size-13"
                disabled={deleting}
                icon={TrashIcon}
                iconSize={18}
                onClick={() => {
                  setError("");
                  setRemoval({ anniversary, open: true });
                }}
                type="button"
                variant="danger"
              />
            </li>
          ))}
        </ul>
      )}
      <div aria-hidden="true" className="h-16 shrink-0" />
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 mx-auto max-w-(--app-width) bg-[linear-gradient(transparent,var(--color-background)_32px)] px-5 pt-8 pb-[calc(--spacing(4)+env(safe-area-inset-bottom))] [&>*]:pointer-events-auto">
        <AnniversarySheet formStyle={formStyle} onCreate={onCreate} today={today} />
      </div>
      <ConfirmDialog
        cancelButton={
          <ConfirmDialogCancelButton disabled={deleting} onClick={closeRemoval}>
            취소
          </ConfirmDialogCancelButton>
        }
        confirmButton={
          <Button color="danger" loading={deleting} onClick={remove}>
            삭제
          </Button>
        }
        description={
          <>
            {removal?.anniversary.name}
            {error && (
              <span className="mt-2 block text-destructive" role="alert">
                {error}
              </span>
            )}
          </>
        }
        onClose={() => {
          if (!deleting) closeRemoval();
        }}
        open={removal?.open ?? false}
        title="기념일을 삭제할까요?"
      />
    </>
  );
}
