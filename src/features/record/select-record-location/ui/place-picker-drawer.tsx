"use client";

import { useState } from "react";

import { PlusIcon } from "@phosphor-icons/react";

import { Button } from "@/shared/ui/button";
import { Drawer, DrawerContent, DrawerTrigger, DrawerVirtualKeyboardProvider } from "@/shared/ui/drawer";

import type { RecordLocationPlace, RecordLocationRegion } from "../model/location-picker";
import { PlacePickerPanel } from "./place-picker-panel";

type PlacePickerSelection = {
  place: RecordLocationPlace;
  region: RecordLocationRegion;
};

type PlacePickerDrawerProps = {
  disabled?: boolean;
  maxSelectionCount: number;
  onAdd: (selections: PlacePickerSelection[]) => void;
  region: RecordLocationRegion | null;
  selectedKeys: Set<string>;
};

export function PlacePickerDrawer({
  disabled,
  maxSelectionCount,
  onAdd,
  region,
  selectedKeys,
}: PlacePickerDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Drawer onOpenChange={setOpen} open={open} showSwipeHandle>
      <DrawerTrigger
        disabled={disabled}
        render={<Button disabled={disabled} size="large" type="button" variant="neutral" />}
      >
        <PlusIcon aria-hidden="true" data-icon="inline-start" strokeWidth={2} />새 장소 검색
      </DrawerTrigger>
      <DrawerVirtualKeyboardProvider>
        <DrawerContent className="[--drawer-height:var(--drawer-content-max-height)]">
          <PlacePickerPanel
            key={String(open)}
            maxSelectionCount={maxSelectionCount}
            onAdd={(selections) => {
              onAdd(selections);
              setOpen(false);
            }}
            region={region}
            selectedKeys={selectedKeys}
          />
        </DrawerContent>
      </DrawerVirtualKeyboardProvider>
    </Drawer>
  );
}
