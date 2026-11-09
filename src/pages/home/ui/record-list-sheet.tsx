"use client";

import { useEffect, useRef } from "react";

import { RecordCard, RecordDateGroups } from "@/entities/record";
import { BottomSheet, FULL_SHEET_HEIGHT } from "@/shared/ui/bottom-sheet";

import type { HomeRecord } from "../model/retrospect";

export type RecordListSheetState = {
  records: HomeRecord[];
  title: string;
};

const HISTORY_KEY = "didWhatHomeSheet";

const renderRecord = (record: HomeRecord) => <RecordCard record={record} />;

type RecordListSheetProps = {
  onClose: () => void;
  sheet: RecordListSheetState | null;
};

export function RecordListSheet({ onClose, sheet }: RecordListSheetProps) {
  const open = sheet !== null;
  const previous = useRef<RecordListSheetState | null>(null);
  if (sheet) previous.current = sheet;
  const content = sheet ?? previous.current;

  useEffect(() => {
    if (!open) return;
    window.history.pushState({ [HISTORY_KEY]: true }, "");
    const handlePop = () => {
      if (!window.history.state?.[HISTORY_KEY]) onClose();
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, [open, onClose]);

  const close = () => {
    if (window.history.state?.[HISTORY_KEY]) window.history.back();
    else onClose();
  };

  return (
    <BottomSheet onOpenChange={(nextOpen) => !nextOpen && close()} open={open} showSwipeHandle>
      <BottomSheet.Content
        className="[--bottom-sheet-content-max-height:calc(100dvh-env(safe-area-inset-top)-16px)]"
        style={{ height: FULL_SHEET_HEIGHT }}
      >
        <BottomSheet.Header className="text-left">
          <BottomSheet.Title className="font-bold text-xl tracking-[-0.03em]">{content?.title}</BottomSheet.Title>
          <BottomSheet.Description className="text-left">{content?.records.length ?? 0}건</BottomSheet.Description>
        </BottomSheet.Header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-4 pb-[calc(--spacing(6)+env(safe-area-inset-bottom))]">
          {content && <RecordDateGroups records={content.records} renderRecord={renderRecord} />}
        </div>
      </BottomSheet.Content>
    </BottomSheet>
  );
}
