"use client";

import { useState } from "react";

import { XIcon } from "@phosphor-icons/react";

import type { PlaceOption } from "@/entities/place";
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from "@/shared/ui/field";
import { IconButton } from "@/shared/ui/icon-button";

import type { RecordLocationPlace, RecordLocationRegion } from "../model/location-picker";
import { PlacePickerDrawer } from "./place-picker-drawer";
import { RegionPickerDialog } from "./region-picker-dialog";
import { SavedPlacePickerDrawer } from "./saved-place-picker-drawer";

const MAX_VISITED_PLACES = 10;

type RecordLocationFieldsProps = {
  initialPlaces?: RecordLocationPlace[];
  initialRegion?: RecordLocationRegion;
  onValueChange?: (region: RecordLocationRegion | null, places: RecordLocationPlace[]) => void;
  placeError?: string;
  regionError?: string;
  savedPlaces: PlaceOption[];
};

export function RecordLocationFields({
  initialPlaces = [],
  initialRegion,
  onValueChange,
  placeError,
  regionError,
  savedPlaces,
}: RecordLocationFieldsProps) {
  const [region, setRegion] = useState<RecordLocationRegion | null>(initialRegion ?? null);
  const [places, setPlaces] = useState(initialPlaces);

  const selectRegion = (nextRegion: RecordLocationRegion) => {
    if (nextRegion.code === region?.code) return;

    setRegion(nextRegion);
    onValueChange?.(nextRegion, places);
  };

  const addSearchedPlaces = (selections: Array<{ place: RecordLocationPlace; region: RecordLocationRegion }>) => {
    const availableCount = MAX_VISITED_PLACES - places.length;
    const additions = selections
      .filter(({ place }) => !places.some((current) => current.key === place.key))
      .slice(0, availableCount);
    if (!additions.length) return;

    const nextRegion = region ?? additions[0].region;
    const nextPlaces = [...places, ...additions.map(({ place }) => place)];
    if (!region) setRegion(nextRegion);
    setPlaces(nextPlaces);
    onValueChange?.(nextRegion, nextPlaces);
  };

  const removePlace = (key: string) => {
    const nextPlaces = places.filter((item) => item.key !== key);
    setPlaces(nextPlaces);
    onValueChange?.(region, nextPlaces);
  };

  const addSavedPlaces = (selectedPlaces: RecordLocationPlace[]) => {
    if (!region) return;

    const availableCount = MAX_VISITED_PLACES - places.length;
    const additions = selectedPlaces
      .filter((place) => !places.some((current) => current.key === place.key))
      .slice(0, availableCount);
    if (!additions.length) return;

    const nextPlaces = [...places, ...additions];
    setPlaces(nextPlaces);
    onValueChange?.(region, nextPlaces);
  };

  const selectedKeys = new Set(places.map((place) => place.key));

  return (
    <>
      <input name="regionCode" type="hidden" value={region?.code ?? ""} />
      <input name="regionLabel" type="hidden" value={region?.label ?? ""} />
      <input name="regionName" type="hidden" value={region?.fullName ?? ""} />
      <input name="places" type="hidden" value={JSON.stringify(places.map((place) => place.reference))} />

      <Field data-invalid={Boolean(regionError)}>
        <FieldLabel className="font-semibold text-base">어느 지역에 갔나요?</FieldLabel>
        <RegionPickerDialog
          aria-describedby={regionError ? "regionCode-error" : undefined}
          aria-invalid={Boolean(regionError)}
          onSelect={selectRegion}
          region={region}
        />
        <FieldError id="regionCode-error">{regionError}</FieldError>
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
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-sm">{place.name}</p>
                    <p className="mt-0.5 truncate text-muted-foreground text-xs">{place.address ?? "주소 정보 없음"}</p>
                  </div>
                  <IconButton
                    aria-label={`${place.name} 방문 장소에서 제거`}
                    icon={XIcon}
                    iconSize={18}
                    iconStrokeWidth={2}
                    onClick={() => removePlace(place.key)}
                    type="button"
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <SavedPlacePickerDrawer
            disabled={!region || savedPlaces.length === 0 || places.length >= MAX_VISITED_PLACES}
            maxSelectionCount={MAX_VISITED_PLACES - places.length}
            onAdd={addSavedPlaces}
            region={region}
            savedPlaces={savedPlaces}
            selectedKeys={selectedKeys}
          />
          <PlacePickerDrawer
            disabled={places.length >= MAX_VISITED_PLACES}
            maxSelectionCount={MAX_VISITED_PLACES - places.length}
            onAdd={addSearchedPlaces}
            region={region}
            selectedKeys={selectedKeys}
          />
        </div>
        <FieldError id="places-error">{placeError}</FieldError>
      </Field>
    </>
  );
}
