"use client";

import { useState } from "react";

import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { Button } from "@/shared/ui/button";

import type { RecordLocationPlace, RecordLocationRegion } from "../model/location-picker";
import { PlacePickerPanel } from "./place-picker-panel";

type PlacePickerBottomSheetProps = {
  disabled?: boolean;
  maxSelectionCount: number;
  onAdd: (places: RecordLocationPlace[]) => void;
  regions: RecordLocationRegion[];
  selectedKeys: Set<string>;
};

export function PlacePickerBottomSheet({
  disabled,
  maxSelectionCount,
  onAdd,
  regions,
  selectedKeys,
}: PlacePickerBottomSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <BottomSheet onOpenChange={setOpen} open={open} showSwipeHandle>
      <BottomSheet.Trigger
        disabled={disabled}
        render={<Button disabled={disabled} size="large" type="button" variant="neutral" />}
      >
        새 장소 검색
      </BottomSheet.Trigger>
      <BottomSheet.VirtualKeyboardProvider>
        <BottomSheet.Content className="bottom-(--drawer-keyboard-inset,0px) pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] [--drawer-content-max-height:calc(100dvh-env(safe-area-inset-top)-16px-var(--drawer-keyboard-inset,0px))] [--drawer-height:var(--drawer-content-max-height)]">
          <PlacePickerPanel
            key={String(open)}
            maxSelectionCount={maxSelectionCount}
            onAdd={(places) => {
              onAdd(places);
              setOpen(false);
            }}
            regions={regions}
            selectedKeys={selectedKeys}
          />
        </BottomSheet.Content>
      </BottomSheet.VirtualKeyboardProvider>
    </BottomSheet>
  );
}
