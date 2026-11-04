"use client";

import { type ReactNode, useState } from "react";

import type { RecordSummary } from "@/entities/record";
import { cn } from "@/shared/lib/utils";
import { BottomSheet, FULL_SHEET_HEIGHT } from "@/shared/ui/bottom-sheet";

import { RecordSheetDetail } from "./record-sheet-detail";

type RecordDetailBottomSheetProps = {
  /** 시트 아래에 고정할 버튼. 댓글을 쓰는 동안에는 숨긴다. */
  action?: ReactNode;
  backLabel: string;
  showBackButton?: boolean;
  member: { id: string; name: string };
  /** 삭제한 뒤 할 일. 넘기지 않으면 시트를 닫는다. */
  onDeleted?: () => void;
  onMissing?: () => void;
  onOpenChange: (open: boolean) => void;
  onCloseComplete?: () => void;
  open: boolean;
  record: Pick<RecordSummary, "id"> | null;
  screen?: boolean;
};

export function RecordDetailBottomSheet({
  action,
  backLabel,
  showBackButton,
  member,
  onDeleted,
  onMissing,
  onOpenChange,
  onCloseComplete,
  open,
  record,
  screen,
}: RecordDetailBottomSheetProps) {
  const [draft, setDraft] = useState("");

  return (
    <BottomSheet
      onOpenChange={onOpenChange}
      onOpenChangeComplete={(nextOpen) => {
        if (nextOpen) return;
        setDraft("");
        onCloseComplete?.();
      }}
      open={open}
      showSwipeHandle={!screen}
    >
      <BottomSheet.VirtualKeyboardProvider>
        <BottomSheet.Content
          data-record-sheet=""
          overlayHandle
          className={cn(
            "bottom-(--drawer-keyboard-inset,0px)",
            screen
              ? "rounded-none border-0 bg-background [--bottom-sheet-bleed-background:var(--color-background)] [--bottom-sheet-content-max-height:calc(100dvh-var(--drawer-keyboard-inset,0px))]"
              : "[--bottom-sheet-content-max-height:calc(100dvh-env(safe-area-inset-top)-16px-var(--drawer-keyboard-inset,0px))]",
          )}
          style={{ height: screen ? "calc(100dvh - var(--drawer-keyboard-inset, 0px))" : FULL_SHEET_HEIGHT }}
        >
          {record ? (
            <RecordSheetDetail
              action={action}
              backLabel={backLabel}
              showBackButton={showBackButton}
              draft={draft}
              key={record.id}
              member={member}
              onBack={() => onOpenChange(false)}
              onDeleted={onDeleted}
              onMissing={onMissing}
              onDraftChange={setDraft}
              recordId={record.id}
              screen={screen}
            />
          ) : null}
        </BottomSheet.Content>
      </BottomSheet.VirtualKeyboardProvider>
    </BottomSheet>
  );
}
