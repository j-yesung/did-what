"use client";

import { type Dispatch, type SetStateAction, useState } from "react";

import { PlaceIconTile, type PlaceOption } from "@/entities/place";
import { getRecordRegionKey, MAX_VISITED_PLACES, MAX_VISITED_REGIONS } from "@/entities/record";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog, ConfirmDialogCancelButton } from "@/shared/ui/confirm-dialog";
import { Field, FieldError } from "@/shared/ui/field";

import {
  getRecordLocationSelectionError,
  type PlacePickerDraft,
  type RecordLocationPlace,
  type RecordLocationRegion,
  removeRecordLocationRegion,
  toVisitedRegions,
} from "../model/location-picker";
import { PlacePickerBottomSheet } from "./place-picker-bottom-sheet";
import { SelectedLocationCard } from "./selected-location-card";

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

  const addPlaces = (additions: RecordLocationPlace[], regionAdditions: RecordLocationRegion[]) => {
    const nextAdditions = additions.filter((place) => !places.some((current) => current.key === place.key));
    const existingRegionKeys = new Set(regions.map((region) => getRecordRegionKey(region)));
    const nextRegionAdditions = regionAdditions.filter((region) => {
      const key = getRecordRegionKey(region);
      if (existingRegionKeys.has(key)) return false;
      existingRegionKeys.add(key);
      return true;
    });
    if (!nextAdditions.length && !nextRegionAdditions.length) return;
    const nextPlaces = [...places, ...nextAdditions];
    const nextRegions = [...regions, ...nextRegionAdditions];
    const error = getRecordLocationSelectionError(nextRegions, nextPlaces);
    if (error) return error;

    apply(nextRegions, nextPlaces);
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

      <Field aria-label="방문한 곳" data-invalid={Boolean(regionError || placeError)}>
        {places.length || regions.length ? (
          <ul aria-label="방문한 곳 목록" className="flex flex-col gap-2">
            {places.map((place) => (
              <SelectedLocationCard
                key={place.key}
                name={place.name}
                description={place.region.label}
                icon={
                  <PlaceIconTile
                    place={
                      savedPlaces.find(
                        (saved) => place.reference.kind === "existing" && saved.id === place.reference.placeId,
                      ) ?? place
                    }
                  />
                }
                removeLabel={`${place.name} 방문 장소에서 제거`}
                onRemove={() => removePlace(place.key)}
              />
            ))}
            {regions
              .filter(
                (region) => !places.some((place) => getRecordRegionKey(place.region) === getRecordRegionKey(region)),
              )
              .map((region) => (
                <SelectedLocationCard
                  key={getRecordRegionKey(region)}
                  name={region.label}
                  description="지역만 기록"
                  icon={<PlaceIconTile className="bg-muted text-muted-foreground" place={{}} />}
                  removeLabel={`${region.label} 방문 지역에서 제거`}
                  onRemove={() => requestRemoveRegion(region)}
                />
              ))}
          </ul>
        ) : null}

        <PlacePickerBottomSheet
          draft={pickerDraft}
          onDraftChange={onPickerDraftChange}
          searchRegionName={searchRegionName}
          disabled={places.length >= MAX_VISITED_PLACES && visitedRegions.length >= MAX_VISITED_REGIONS}
          maxSelectionCount={MAX_VISITED_PLACES - places.length}
          onAdd={addPlaces}
          regions={visitedRegions}
          savedPlaces={savedPlaces}
          selectedKeys={selectedKeys}
        />
        <FieldError id="places-error">{placeError ?? regionError}</FieldError>
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
