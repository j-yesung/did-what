"use client";

import type { ComponentProps, ReactNode } from "react";

import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { Button } from "@/shared/ui/button";

type RecordFormSheetProps = {
  children: ReactNode;
  finalFocus?: ComponentProps<typeof BottomSheet.Content>["finalFocus"];
  onClose: () => void;
  open: boolean;
  title: string;
};

export function RecordFormSheet({ children, finalFocus, onClose, open, title }: RecordFormSheetProps) {
  return (
    <BottomSheet
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      open={open}
      showSwipeHandle
    >
      <BottomSheet.Content finalFocus={finalFocus}>
        <BottomSheet.Header>
          <BottomSheet.Title className="text-left font-bold text-xl">{title}</BottomSheet.Title>
        </BottomSheet.Header>
        <div className="flex min-h-0 flex-col overflow-y-auto overscroll-contain px-5 py-6">{children}</div>
        <BottomSheet.Footer>
          <Button fullWidth onClick={onClose} size="xlarge" type="button">
            확인
          </Button>
        </BottomSheet.Footer>
      </BottomSheet.Content>
    </BottomSheet>
  );
}
