"use client";

import { useState } from "react";

import type { RecordSummary } from "@/entities/record";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { RecordSheetDetail } from "@/widgets/record-detail";

const SHEET_HEIGHT = "calc(100dvh - env(safe-area-inset-top) - 16px - var(--drawer-keyboard-inset, 0px))";

type RecordDetailBottomSheetProps = {
  member: { id: string; name: string };
  onOpenChange: (open: boolean) => void;
  open: boolean;
  record: RecordSummary | null;
};

export function RecordDetailBottomSheet({ member, onOpenChange, open, record }: RecordDetailBottomSheetProps) {
  const [draft, setDraft] = useState("");

  return (
    <BottomSheet
      onOpenChange={onOpenChange}
      onOpenChangeComplete={(nextOpen) => {
        if (nextOpen) return;
        setDraft("");
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
    </BottomSheet>
  );
}
