"use client";

import { type Dispatch, type SetStateAction, useState } from "react";

import { PlusIcon } from "@phosphor-icons/react";

import type { PlaceOption } from "@/entities/place";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { Button } from "@/shared/ui/button";

import {
  createPlacePickerDraft,
  type PlacePickerDraft,
  type PlacePickerMode,
  type RecordLocationPlace,
  type RecordLocationRegion,
} from "../../model/location-picker";
import { PlacePickerPanel } from "./place-picker-panel";

type PlacePickerBottomSheetProps = {
  mode: PlacePickerMode;
  triggerLabel: string;
  error?: string;
  disabled?: boolean;
  maxSelectionCount: number;
  onAdd: (places: RecordLocationPlace[], regions: RecordLocationRegion[]) => string | undefined;
  draft?: PlacePickerDraft;
  onDraftChange?: Dispatch<SetStateAction<PlacePickerDraft>>;
  searchRegionName?: string;
  regions: RecordLocationRegion[];
  selectedKeys: Set<string>;
  savedPlaces: PlaceOption[];
};

export function PlacePickerBottomSheet({
  mode,
  triggerLabel,
  error,
  disabled,
  maxSelectionCount,
  onAdd,
  regions,
  selectedKeys,
  savedPlaces,
  draft,
  onDraftChange,
  searchRegionName,
}: PlacePickerBottomSheetProps) {
  const [open, setOpen] = useState(false);
  const [localDraft, setLocalDraft] = useState(createPlacePickerDraft);
  const setDraft = onDraftChange ?? setLocalDraft;

  return (
    <BottomSheet onOpenChange={setOpen} open={open} showSwipeHandle>
      <BottomSheet.Trigger
        disabled={disabled}
        render={
          <Button
            aria-describedby={error ? `${mode}-error` : undefined}
            aria-invalid={Boolean(error)}
            disabled={disabled}
            fullWidth
            size="large"
            type="button"
            variant="neutral"
          />
        }
      >
        <PlusIcon aria-hidden="true" className="size-4" />
        {triggerLabel}
      </BottomSheet.Trigger>
      <BottomSheet.VirtualKeyboardProvider>
        <BottomSheet.Content className="bottom-(--drawer-keyboard-inset,0px) pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] [--drawer-content-max-height:calc(100dvh-env(safe-area-inset-top)-var(--drawer-keyboard-inset,0px))] [--drawer-height:var(--drawer-content-max-height)]">
          <PlacePickerPanel
            mode={mode}
            draft={draft ?? localDraft}
            onDraftChange={setDraft}
            searchRegionName={searchRegionName}
            maxSelectionCount={maxSelectionCount}
            onAdd={(places, regions) => {
              const error = onAdd(places, regions);
              if (error) return error;
              setDraft((current) => ({
                ...current,
                ...(mode === "regions" ? { selectedRegions: new Map() } : { selectedPlaces: new Map() }),
              }));
              setOpen(false);
            }}
            regions={regions}
            selectedKeys={selectedKeys}
            savedPlaces={savedPlaces}
          />
        </BottomSheet.Content>
      </BottomSheet.VirtualKeyboardProvider>
    </BottomSheet>
  );
}
