"use client";

import { useState } from "react";

import { PlusIcon } from "@phosphor-icons/react";

import { Button } from "@/shared/ui/button";
import { Drawer, DrawerTrigger, DrawerVirtualKeyboardProvider } from "@/shared/ui/drawer";

import type { RecordLocationRegion } from "../model/location-picker";
import { RegionSearchContent } from "./region-search-content";

type RegionPickerDialogProps = {
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  disabled?: boolean;
  onSelect: (region: RecordLocationRegion) => void;
};

export function RegionPickerDialog({ disabled, onSelect, ...ariaProps }: RegionPickerDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Drawer onOpenChange={setOpen} open={open} showSwipeHandle>
      <DrawerTrigger
        disabled={disabled}
        render={<Button {...ariaProps} disabled={disabled} fullWidth size="large" type="button" variant="neutral" />}
      >
        <PlusIcon aria-hidden="true" className="size-4" strokeWidth={2} />
        지역 추가
      </DrawerTrigger>
      <DrawerVirtualKeyboardProvider>
        <RegionSearchContent
          onSelect={(region) => {
            onSelect(region);
            setOpen(false);
          }}
        />
      </DrawerVirtualKeyboardProvider>
    </Drawer>
  );
}
