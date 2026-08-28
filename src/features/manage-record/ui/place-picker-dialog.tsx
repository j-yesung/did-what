"use client";

import { useState } from "react";

import { PlusIcon } from "@phosphor-icons/react";

import type { PlaceOption } from "@/entities/place";
import { Button } from "@/shared/ui/button";
import { Drawer, DrawerContent, DrawerTrigger, DrawerVirtualKeyboardProvider } from "@/shared/ui/drawer";

import type { RecordLocationPlace, RecordLocationRegion } from "../model/location-picker";
import { PlacePickerPanel } from "./place-picker-panel";

type PlacePickerDialogProps = {
  disabled?: boolean;
  onAdd: (place: RecordLocationPlace, region: RecordLocationRegion) => void;
  region: RecordLocationRegion | null;
  savedPlaces: PlaceOption[];
  selectedKeys: Set<string>;
};

export function PlacePickerDialog({ disabled, onAdd, region, savedPlaces, selectedKeys }: PlacePickerDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Drawer onOpenChange={setOpen} open={open} showSwipeHandle>
      <DrawerTrigger
        disabled={disabled}
        render={<Button disabled={disabled} size="large" type="button" variant="neutral" />}
      >
        <PlusIcon aria-hidden="true" className="size-4" strokeWidth={2} />
        방문 장소 추가
      </DrawerTrigger>
      <DrawerVirtualKeyboardProvider>
        <DrawerContent className="[--drawer-height:var(--drawer-content-max-height)]">
          <PlacePickerPanel
            onAdd={(place, placeRegion) => {
              onAdd(place, placeRegion);
              setOpen(false);
            }}
            region={region}
            savedPlaces={savedPlaces}
            selectedKeys={selectedKeys}
          />
        </DrawerContent>
      </DrawerVirtualKeyboardProvider>
    </Drawer>
  );
}
