"use client";

import type { ReactNode } from "react";

import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/shared/ui/drawer";

type ActionSheetProps = {
  children: ReactNode;
  description?: ReactNode;
  open: boolean;
  title: ReactNode;
  onOpenChange: (open: boolean) => void;
};

export function ActionSheet({ children, description, open, title, onOpenChange }: ActionSheetProps) {
  return (
    <Drawer onOpenChange={onOpenChange} open={open} showSwipeHandle>
      <DrawerContent className="[--drawer-height:auto]">
        <DrawerHeader className="gap-1 px-5 pt-5 pb-4 text-left group-data-[swipe-axis=y]/drawer-popup:text-left">
          <DrawerTitle className="line-clamp-2 break-keep font-bold text-xl leading-7">{title}</DrawerTitle>
          <DrawerDescription className="text-left text-sm leading-5" render={<div />}>
            {description}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex gap-2 px-5 pb-5 *:flex-1">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}
