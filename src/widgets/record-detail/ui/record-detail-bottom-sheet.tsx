"use client";

import { useState } from "react";

import type { RecordSummary } from "@/entities/record";
import { cn } from "@/shared/lib/utils";
import { BottomSheet, FULL_SHEET_HEIGHT } from "@/shared/ui/bottom-sheet";

import { RecordSheetDetail } from "./record-sheet-detail";

type RecordDetailBottomSheetProps = {
  backLabel: string;
  /** 시트와 삭제 확인 창에 더할 클래스. 앱 테마와 상관없이 어두운 화면에서는 `dark`를 넘긴다. */
  className?: string;
  member: { id: string; name: string };
  /** 삭제한 뒤 할 일. 넘기지 않으면 시트를 닫는다. */
  onDeleted?: () => void;
  onOpenChange: (open: boolean) => void;
  onCloseComplete?: () => void;
  open: boolean;
  record: Pick<RecordSummary, "id"> | null;
};

export function RecordDetailBottomSheet({
  backLabel,
  className,
  member,
  onDeleted,
  onOpenChange,
  onCloseComplete,
  open,
  record,
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
      showSwipeHandle
    >
      <BottomSheet.VirtualKeyboardProvider>
        <BottomSheet.Content
          overlayHandle
          className={cn(
            "bottom-(--drawer-keyboard-inset,0px) [--drawer-content-max-height:calc(100dvh-env(safe-area-inset-top)-16px-var(--drawer-keyboard-inset,0px))]",
            className,
          )}
          style={{ height: FULL_SHEET_HEIGHT }}
        >
          {record ? (
            <RecordSheetDetail
              backLabel={backLabel}
              confirmClassName={className}
              draft={draft}
              key={record.id}
              member={member}
              onBack={() => onOpenChange(false)}
              onDeleted={onDeleted}
              onDraftChange={setDraft}
              recordId={record.id}
            />
          ) : null}
        </BottomSheet.Content>
      </BottomSheet.VirtualKeyboardProvider>
    </BottomSheet>
  );
}
