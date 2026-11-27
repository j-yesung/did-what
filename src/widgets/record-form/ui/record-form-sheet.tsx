"use client";

import type { ComponentProps, ReactNode } from "react";

import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { Button } from "@/shared/ui/button";

type RecordFormSheetProps = {
  children: ReactNode;
  finalFocus?: ComponentProps<typeof BottomSheet.Content>["finalFocus"];
  onClose: () => void;
  onConfirm?: () => void;
  open: boolean;
  title?: string;
};

export function RecordFormSheet({ children, finalFocus, onClose, onConfirm, open, title }: RecordFormSheetProps) {
  return (
    <BottomSheet
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      open={open}
      showSwipeHandle
    >
      <BottomSheet.Content finalFocus={finalFocus} overlayHandle>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <BottomSheet.Header className="pt-7" glass />
          <div className="px-5 pt-10 pb-6">
            {title ? (
              <>
                <BottomSheet.Title className="font-bold text-xl">{title}</BottomSheet.Title>
                <div className="mt-6 flex flex-col">{children}</div>
              </>
            ) : (
              children
            )}
          </div>
        </div>
        <BottomSheet.Footer>
          <Button fullWidth onClick={onConfirm ?? onClose} size="xlarge" type="button">
            확인
          </Button>
        </BottomSheet.Footer>
      </BottomSheet.Content>
    </BottomSheet>
  );
}
