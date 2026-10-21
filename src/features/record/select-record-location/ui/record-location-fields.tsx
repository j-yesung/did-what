"use client";

import { type Dispatch, type SetStateAction, useState } from "react";

import { XIcon } from "@phosphor-icons/react";

import { PlaceIconTile, type PlaceOption } from "@/entities/place";
import { getRecordRegionKey, MAX_VISITED_PLACES, MAX_VISITED_REGIONS } from "@/entities/record";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog, ConfirmDialogCancelButton } from "@/shared/ui/confirm-dialog";
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from "@/shared/ui/field";
import { IconButton } from "@/shared/ui/icon-button";

import {
  getRecordLocationSelectionError,
  type PlacePickerDraft,
  type RecordLocationPlace,
  type RecordLocationRegion,
  removeRecordLocationRegion,
  toVisitedRegions,
} from "../model/location-picker";
import { PlacePickerBottomSheet } from "./place-picker-bottom-sheet";
import { RegionPickerDialog } from "./region-picker-dialog";

type RecordLocationFieldsProps = {
  initialPlaces?: RecordLocationPlace[];
  initialRegions?: RecordLocationRegion[];
  onValueChange?: (regions: RecordLocationRegion[], places: RecordLocationPlace[]) => void;
  placeError?: string;
  regionError?: string;
  savedPlaces: PlaceOption[];
  pickerDraft?: PlacePickerDraft;
  onPickerDraftChange?: Dispatch<SetStateAction<PlacePickerDraft>>;
  searchRegionName?: string;
};

export function RecordLocationFields({
  initialPlaces = [],
  initialRegions = [],
  onValueChange,
  placeError,
  regionError,
  savedPlaces,
  pickerDraft,
  onPickerDraftChange,
  searchRegionName,
}: RecordLocationFieldsProps) {
  const [regions, setRegions] = useState(initialRegions);
  const [places, setPlaces] = useState(initialPlaces);
  const [regionToRemove, setRegionToRemove] = useState<RecordLocationRegion | null>(null);

  const visitedRegions = toVisitedRegions(regions, places);

  const apply = (nextRegions: RecordLocationRegion[], nextPlaces: RecordLocationPlace[]) => {
    setRegions(nextRegions);
    setPlaces(nextPlaces);
    onValueChange?.(nextRegions, nextPlaces);
  };

  const selectRegion = (nextRegion: RecordLocationRegion) => {
    if (visitedRegions.some((region) => getRecordRegionKey(region) === getRecordRegionKey(nextRegion))) return;
    if (visitedRegions.length >= MAX_VISITED_REGIONS) return;

    apply([...regions, nextRegion], places);
  };

  const addPlaces = (additions: RecordLocationPlace[]) => {
    const nextAdditions = additions.filter((place) => !places.some((current) => current.key === place.key));
    if (!nextAdditions.length) return;

    const nextPlaces = [...places, ...nextAdditions];
    const error = getRecordLocationSelectionError(regions, nextPlaces);
    if (error) return error;

    apply(regions, nextPlaces);
  };

  const removePlace = (key: string) => {
    apply(
      regions,
      places.filter((place) => place.key !== key),
    );
  };

  const removeRegion = (target: RecordLocationRegion) => {
    const next = removeRecordLocationRegion(regions, places, target);
    apply(next.regions, next.places);
  };

  const requestRemoveRegion = (target: RecordLocationRegion) => {
    if (removeRecordLocationRegion(regions, places, target).places.length < places.length) {
      setRegionToRemove(target);
      return;
    }

    removeRegion(target);
  };

  const selectedKeys = new Set(places.map((place) => place.key));

  return (
    <>
      <input
        name="regions"
        type="hidden"
        value={JSON.stringify(regions.map(({ code, fullName, label }) => ({ code, label, name: fullName })))}
      />
      <input name="places" type="hidden" value={JSON.stringify(places.map((place) => place.reference))} />

      <Field data-invalid={Boolean(regionError)}>
        <FieldContent className="gap-1">
          <FieldLabel className="font-semibold text-base">어느 지역에 갔나요?</FieldLabel>
          <FieldDescription>최대 {MAX_VISITED_REGIONS}곳까지 담을 수 있어요.</FieldDescription>
        </FieldContent>

        {visitedRegions.length ? (
          <ul aria-label="방문 지역" className="flex flex-wrap gap-1.5">
            {visitedRegions.map((region) => (
              <li key={getRecordRegionKey(region)}>
                <span className="flex h-8 items-center gap-0.5 rounded-lg border bg-card pr-0.5 pl-2.5">
                  <span className="max-w-40 truncate font-semibold text-[13px]" title={region.fullName}>
                    {region.label}
                  </span>
                  <IconButton
                    aria-label={`${region.label} 방문 지역에서 제거`}
                    icon={XIcon}
                    iconSize={14}
                    onClick={() => requestRemoveRegion(region)}
                    size="sm"
                    type="button"
                  />
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        <RegionPickerDialog
          searchRegionName={searchRegionName}
          aria-describedby={regionError ? "regions-error" : undefined}
          aria-invalid={Boolean(regionError)}
          disabled={visitedRegions.length >= MAX_VISITED_REGIONS}
          onSelect={selectRegion}
        />
        <FieldError id="regions-error">{regionError}</FieldError>
      </Field>

      <Field data-invalid={Boolean(placeError)}>
        <FieldContent className="gap-1">
          <FieldLabel className="font-semibold text-base">방문 장소</FieldLabel>
          <FieldDescription>최대 {MAX_VISITED_PLACES}곳까지 추가할 수 있어요.</FieldDescription>
        </FieldContent>

        {places.length ? (
          <ul className="flex flex-col gap-2">
            {places.map((place) => (
              <li className="rounded-xl border bg-card px-3 py-2" key={place.key}>
                <div className="flex min-h-11 items-center gap-3">
                  <PlaceIconTile
                    place={
                      savedPlaces.find(
                        (saved) => place.reference.kind === "existing" && saved.id === place.reference.placeId,
                      ) ?? place
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 break-words font-medium text-sm">{place.name}</p>
                    <p className="mt-0.5 truncate text-muted-foreground text-xs">{place.region.label}</p>
                  </div>
                  <IconButton
                    aria-label={`${place.name} 방문 장소에서 제거`}
                    icon={XIcon}
                    iconSize={18}
                    onClick={() => removePlace(place.key)}
                    type="button"
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        <PlacePickerBottomSheet
          draft={pickerDraft}
          onDraftChange={onPickerDraftChange}
          searchRegionName={searchRegionName}
          disabled={places.length >= MAX_VISITED_PLACES}
          maxSelectionCount={MAX_VISITED_PLACES - places.length}
          onAdd={addPlaces}
          regions={visitedRegions.filter(
            (region, index) => visitedRegions.findIndex((item) => item.code === region.code) === index,
          )}
          savedPlaces={savedPlaces}
          selectedKeys={selectedKeys}
        />
        <FieldError id="places-error">{placeError}</FieldError>
      </Field>

      <ConfirmDialog
        cancelButton={
          <ConfirmDialogCancelButton onClick={() => setRegionToRemove(null)}>취소</ConfirmDialogCancelButton>
        }
        confirmButton={
          <Button
            color="danger"
            onClick={() => {
              if (regionToRemove) removeRegion(regionToRemove);
              setRegionToRemove(null);
            }}
            variant="fill"
          >
            함께 제거
          </Button>
        }
        description={`${regionToRemove?.label ?? ""}에서 고른 방문 장소도 함께 제거돼요.`}
        onClose={() => setRegionToRemove(null)}
        open={Boolean(regionToRemove)}
        title="지역을 제거할까요?"
      />
    </>
  );
}
