"use client";

import { type Dispatch, type SetStateAction, useState } from "react";

import type { PlaceOption } from "@/entities/place";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { Button } from "@/shared/ui/button";

import {
  createPlacePickerDraft,
  type PlacePickerDraft,
  type RecordLocationPlace,
  type RecordLocationRegion,
} from "../model/location-picker";
import { PlacePickerPanel } from "./place-picker-panel";

type PlacePickerBottomSheetProps = {
  disabled?: boolean;
  maxSelectionCount: number;
  onAdd: (places: RecordLocationPlace[]) => string | undefined;
  draft?: PlacePickerDraft;
  onDraftChange?: Dispatch<SetStateAction<PlacePickerDraft>>;
  searchRegionName?: string;
  regions: RecordLocationRegion[];
  selectedKeys: Set<string>;
  savedPlaces: PlaceOption[];
};

export function PlacePickerBottomSheet({
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
        render={<Button disabled={disabled} fullWidth size="large" type="button" variant="neutral" />}
      >
        장소 추가
      </BottomSheet.Trigger>
      <BottomSheet.VirtualKeyboardProvider>
        <BottomSheet.Content className="bottom-(--drawer-keyboard-inset,0px) pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] [--drawer-content-max-height:calc(100dvh-env(safe-area-inset-top)-16px-var(--drawer-keyboard-inset,0px))] [--drawer-height:var(--drawer-content-max-height)]">
          <PlacePickerPanel
            draft={draft ?? localDraft}
            onDraftChange={setDraft}
            searchRegionName={searchRegionName}
            maxSelectionCount={maxSelectionCount}
            onAdd={(places) => {
              const error = onAdd(places);
              if (error) return error;
              setDraft((current) => ({ ...current, selectedPlaces: new Map() }));
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
