"use client";

import { type FormEvent, type ReactNode, useState } from "react";

import { PlusIcon, TrashIcon } from "@phosphor-icons/react";

import type { Anniversary, AnniversaryActionResult, AnniversaryDraft } from "@/entities/anniversary/model/types";
import { formatMonthDay } from "@/shared/lib/date/format-date";
import { FOCUS_RING, PRESS_FEEDBACK } from "@/shared/lib/interaction";
import { cn } from "@/shared/lib/utils";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog, ConfirmDialogCancelButton } from "@/shared/ui/confirm-dialog";
import { Empty, EmptyHeader, EmptyTitle } from "@/shared/ui/empty";
import { IconButton } from "@/shared/ui/icon-button";
import { ListRowTexts } from "@/shared/ui/list-row";

import { AnniversaryFields } from "./anniversary-fields";

const ANNIVERSARY_FORM_ID = "anniversary-form";

type AnniversaryRemoval = {
  anniversary: Anniversary;
  open: boolean;
};

type AnniversarySheetProps = {
  anniversaries: readonly Anniversary[];
  today: string;
  trigger: ReactNode;
  renderListLabel?: (anniversary: Anniversary) => ReactNode;
  formStyle?: "night" | "date" | "line";
  onCreate: (anniversary: AnniversaryDraft) => Promise<AnniversaryActionResult>;
  onDelete: (id: string) => Promise<AnniversaryActionResult>;
};

export function AnniversarySheet({
  anniversaries,
  today,
  trigger,
  renderListLabel,
  formStyle,
  onCreate,
  onDelete,
}: AnniversarySheetProps) {
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<AnniversaryDraft | null>(null);
  const [removal, setRemoval] = useState<AnniversaryRemoval | null>(null);
  const [error, setError] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const closeRemoval = () => setRemoval((current) => (current?.open ? { ...current, open: false } : current));

  const handleOpenChange = (nextOpen: boolean) => {
    if (busy) return;
    setOpen(nextOpen);
    if (!nextOpen) {
      setDraft(null);
      closeRemoval();
    }
  };

  const startAdding = () => {
    setError("");
    setDraft({ monthDay: today.slice(5), id: crypto.randomUUID(), name: "" });
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft || busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await onCreate(draft);
      if (result.status === "error") setError(result.message ?? "기념일을 저장하지 못했어요.");
      else setDraft(null);
    } catch {
      setError("기념일을 저장하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!removal?.open || busy) return;
    setBusy(true);
    setDeleteError("");
    try {
      const result = await onDelete(removal.anniversary.id);
      if (result.status === "error") setDeleteError(result.message ?? "기념일을 삭제하지 못했어요.");
      else closeRemoval();
    } catch {
      setDeleteError("기념일을 삭제하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <BottomSheet onOpenChange={handleOpenChange} open={open} showSwipeHandle>
      <BottomSheet.Trigger
        render={
          <button
            className={cn("w-full cursor-pointer rounded-[22px] text-left after:hidden", PRESS_FEEDBACK, FOCUS_RING)}
            type="button"
          />
        }
      >
        {trigger}
        <span className="sr-only"> 기념일 목록 열기</span>
      </BottomSheet.Trigger>
      <BottomSheet.VirtualKeyboardProvider>
        <BottomSheet.Content className="bottom-(--drawer-keyboard-inset,0px) [--bottom-sheet-content-max-height:calc(75dvh-var(--drawer-keyboard-inset,0px))]">
          <BottomSheet.Header>
            <BottomSheet.Title className="text-left font-bold text-xl tracking-[-0.03em]">
              {draft ? "기념일 추가" : "기념일 목록"}
            </BottomSheet.Title>
          </BottomSheet.Header>
          <div className="min-h-0 overflow-y-auto overscroll-contain px-5 py-4" key={draft ? "form" : "list"}>
            {draft ? (
              <form id={ANNIVERSARY_FORM_ID} onSubmit={save}>
                <fieldset disabled={busy} className="min-w-0 border-0 p-0">
                  <AnniversaryFields
                    draft={draft}
                    error={error}
                    onChange={(nextDraft) => {
                      setDraft(nextDraft);
                      setError("");
                    }}
                    style={formStyle}
                  />
                </fieldset>
              </form>
            ) : anniversaries.length === 0 ? (
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
                        description={
                          <time dateTime={anniversary.date.slice(5)}>{formatMonthDay(anniversary.date)}</time>
                        }
                        title={anniversary.name}
                      />
                    )}
                    <IconButton
                      aria-label={`${anniversary.name} 삭제`}
                      className="size-13"
                      icon={TrashIcon}
                      iconSize={18}
                      onClick={() => {
                        setDeleteError("");
                        setRemoval({ anniversary, open: true });
                      }}
                      type="button"
                      variant="danger"
                      disabled={busy}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
          <BottomSheet.Footer>
            {draft ? (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  color="dark"
                  disabled={busy}
                  onClick={() => setDraft(null)}
                  size="large"
                  type="button"
                  variant="weak"
                >
                  취소
                </Button>
                <Button form={ANNIVERSARY_FORM_ID} loading={busy} size="large" type="submit">
                  저장
                </Button>
              </div>
            ) : (
              <Button fullWidth onClick={startAdding} size="large" type="button">
                <PlusIcon aria-hidden="true" data-icon="inline-start" />
                기념일 추가
              </Button>
            )}
          </BottomSheet.Footer>
          <ConfirmDialog
            cancelButton={
              <ConfirmDialogCancelButton disabled={busy} onClick={closeRemoval}>
                취소
              </ConfirmDialogCancelButton>
            }
            confirmButton={
              <Button color="danger" loading={busy} onClick={remove}>
                삭제
              </Button>
            }
            description={
              <>
                {removal?.anniversary.name}
                {deleteError && (
                  <span className="mt-2 block text-destructive" role="alert">
                    {deleteError}
                  </span>
                )}
              </>
            }
            onClose={() => {
              if (!busy) closeRemoval();
            }}
            open={removal?.open ?? false}
            title="기념일을 삭제할까요?"
          />
        </BottomSheet.Content>
      </BottomSheet.VirtualKeyboardProvider>
    </BottomSheet>
  );
}
