"use client";

import type { ReactNode } from "react";

import { BottomSheet } from "@/shared/ui/bottom-sheet";

type ActionSheetProps = {
  children: ReactNode;
  description?: ReactNode;
  open: boolean;
  title: ReactNode;
  onOpenChange: (open: boolean) => void;
};

export function ActionSheet({ children, description, open, title, onOpenChange }: ActionSheetProps) {
  return (
    <BottomSheet onOpenChange={onOpenChange} open={open} showSwipeHandle>
      <BottomSheet.Content className="[--drawer-height:auto]">
        <BottomSheet.Header className="gap-1 pt-5 pb-4 text-left group-data-[swipe-axis=y]/bottom-sheet-popup:text-left">
          <BottomSheet.Title className="line-clamp-2 break-keep font-bold text-xl leading-7">{title}</BottomSheet.Title>
          <BottomSheet.Description className="text-left text-sm leading-5" render={<div />}>
            {description}
          </BottomSheet.Description>
        </BottomSheet.Header>

        <BottomSheet.Footer className="flex-row *:flex-1">{children}</BottomSheet.Footer>
      </BottomSheet.Content>
    </BottomSheet>
  );
}
