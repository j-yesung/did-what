"use client";

import { useState } from "react";

import { PlusIcon } from "@phosphor-icons/react";

import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { Button } from "@/shared/ui/button";

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
    <BottomSheet onOpenChange={setOpen} open={open} showSwipeHandle>
      <BottomSheet.Trigger
        disabled={disabled}
        render={<Button {...ariaProps} disabled={disabled} fullWidth size="large" type="button" variant="neutral" />}
      >
        <PlusIcon aria-hidden="true" className="size-4" />
        지역 추가
      </BottomSheet.Trigger>
      <BottomSheet.VirtualKeyboardProvider>
        <RegionSearchContent
          onSelect={(region) => {
            onSelect(region);
            setOpen(false);
          }}
        />
      </BottomSheet.VirtualKeyboardProvider>
    </BottomSheet>
  );
}
