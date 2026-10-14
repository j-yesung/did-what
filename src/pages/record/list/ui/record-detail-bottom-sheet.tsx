"use client";

import { useState } from "react";

import { TrashIcon } from "@phosphor-icons/react";

import type { RecordSummary } from "@/entities/record";
import { DeleteRecordConfirm } from "@/features/record/delete-record";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { LiquidGlassButton } from "@/shared/ui/liquid-glass-button";
import { RecordSheetDetail } from "@/widgets/record-sheet-detail";

const SHEET_HEIGHT = "calc(100dvh - env(safe-area-inset-top) - 16px - var(--drawer-keyboard-inset, 0px))";

type RecordDetailBottomSheetProps = {
  member: { id: string; name: string };
  onOpenChange: (open: boolean) => void;
  open: boolean;
  record: RecordSummary | null;
};

export function RecordDetailBottomSheet({ member, onOpenChange, open, record }: RecordDetailBottomSheetProps) {
  const [draft, setDraft] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <BottomSheet
      onOpenChange={onOpenChange}
      onOpenChangeComplete={(nextOpen) => {
        if (nextOpen) return;
        setDraft("");
        setDeleteOpen(false);
      }}
      open={open}
      showSwipeHandle
    >
      <BottomSheet.VirtualKeyboardProvider>
        <BottomSheet.Content
          overlayHandle
          className="bottom-(--drawer-keyboard-inset,0px) [--drawer-content-max-height:calc(100dvh-env(safe-area-inset-top)-16px-var(--drawer-keyboard-inset,0px))]"
          style={{ height: SHEET_HEIGHT }}
        >
          {record ? (
            <RecordSheetDetail
              actions={
                <LiquidGlassButton
                  aria-label={`${record.activity} 삭제`}
                  className="size-14 shrink-0 text-destructive [&_svg]:size-6"
                  onClick={() => setDeleteOpen(true)}
                  shape="circle"
                >
                  <TrashIcon aria-hidden="true" weight="bold" />
                </LiquidGlassButton>
              }
              backLabel="달력으로"
              draft={draft}
              key={record.id}
              member={member}
              onBack={() => onOpenChange(false)}
              onDraftChange={setDraft}
              recordId={record.id}
            />
          ) : null}
        </BottomSheet.Content>
      </BottomSheet.VirtualKeyboardProvider>
      <DeleteRecordConfirm
        activity={record?.activity ?? ""}
        onClose={() => setDeleteOpen(false)}
        onDeleted={() => onOpenChange(false)}
        open={deleteOpen}
        recordId={record?.id ?? ""}
      />
    </BottomSheet>
  );
}
