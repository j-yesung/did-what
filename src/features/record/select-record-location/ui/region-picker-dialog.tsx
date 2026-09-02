"use client";

import { useState } from "react";

import { CaretRightIcon } from "@phosphor-icons/react";

import { Button } from "@/shared/ui/button";
import { Drawer, DrawerTrigger, DrawerVirtualKeyboardProvider } from "@/shared/ui/drawer";

import type { RecordLocationRegion } from "../model/location-picker";
import { RegionSearchContent } from "./region-search-content";

type RegionPickerDialogProps = {
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  onSelect: (region: RecordLocationRegion) => void;
  region: RecordLocationRegion | null;
};

export function RegionPickerDialog({ onSelect, region, ...ariaProps }: RegionPickerDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Drawer onOpenChange={setOpen} open={open} showSwipeHandle>
      <DrawerTrigger
        render={
          <Button
            {...ariaProps}
            className="justify-start [&>span]:w-full"
            fullWidth
            size="field"
            type="button"
            variant="outline"
          />
        }
      >
        <span className="flex w-full items-center justify-between gap-3">
          <span className="min-w-0">
            {region ? (
              <>
                <span className="block truncate font-medium text-sm">{region.label}</span>
                <span className="mt-1 block truncate text-muted-foreground text-xs">{region.fullName}</span>
              </>
            ) : (
              <span className="text-muted-foreground text-sm">지역을 선택해 주세요</span>
            )}
          </span>
          <CaretRightIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
        </span>
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
