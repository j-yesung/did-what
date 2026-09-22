"use client";

import { useState } from "react";

import { Button } from "@/shared/ui/button";
import { Drawer, DrawerContent, DrawerTrigger, DrawerVirtualKeyboardProvider } from "@/shared/ui/drawer";

import type { RecordLocationPlace, RecordLocationRegion } from "../model/location-picker";
import { PlacePickerPanel } from "./place-picker-panel";

type PlacePickerDrawerProps = {
  disabled?: boolean;
  maxSelectionCount: number;
  onAdd: (places: RecordLocationPlace[]) => void;
  regions: RecordLocationRegion[];
  selectedKeys: Set<string>;
};

export function PlacePickerDrawer({
  disabled,
  maxSelectionCount,
  onAdd,
  regions,
  selectedKeys,
}: PlacePickerDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Drawer onOpenChange={setOpen} open={open} showSwipeHandle>
      <DrawerTrigger
        disabled={disabled}
        render={<Button disabled={disabled} size="large" type="button" variant="neutral" />}
      >
        새 장소 검색
      </DrawerTrigger>
      <DrawerVirtualKeyboardProvider>
        <DrawerContent className="[--drawer-height:var(--drawer-content-max-height)]">
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
        </DrawerContent>
      </DrawerVirtualKeyboardProvider>
    </Drawer>
  );
}
