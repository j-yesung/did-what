"use client";

import { useState } from "react";

import { MapPinAreaIcon, MapPinIcon, TrashIcon } from "@phosphor-icons/react";

import type { PlaceOption } from "@/entities/place";
import { Checkbox } from "@/shared/ui/checkbox";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/shared/ui/field";
import { IconButton } from "@/shared/ui/icon-button";

import type { RecordLocationPlace, RecordLocationRegion } from "../model/location-picker";
import { PlacePickerDialog } from "./place-picker-dialog";
import { RegionPickerDialog } from "./region-picker-dialog";

const FIELD_ICON = "size-4.5 text-foreground [stroke-width:2]";

type RecordLocationFieldsProps = {
  initialPlaces?: RecordLocationPlace[];
  initialRegion?: RecordLocationRegion;
  onChange?: () => void;
  placeError?: string;
  regionError?: string;
  savedPlaces: PlaceOption[];
};

export function RecordLocationFields({
  initialPlaces = [],
  initialRegion,
  onChange,
  placeError,
  regionError,
  savedPlaces,
}: RecordLocationFieldsProps) {
  const [region, setRegion] = useState<RecordLocationRegion | null>(initialRegion ?? null);
  const [places, setPlaces] = useState(initialPlaces);

  function selectRegion(nextRegion: RecordLocationRegion) {
    if (nextRegion.code === region?.code) return;

    setRegion(nextRegion);
    onChange?.();
  }

  function addPlace(place: RecordLocationPlace, placeRegion: RecordLocationRegion) {
    if (places.some((item) => item.key === place.key)) return;

    if (!region) setRegion(placeRegion);
    setPlaces((current) => [...current, place]);
    onChange?.();
  }

  function toggleSave(key: string, checked: boolean) {
    setPlaces((current) =>
      current.map((place) =>
        place.key === key ? { ...place, reference: { ...place.reference, save: checked || place.saved } } : place,
      ),
    );
    onChange?.();
  }

  const selectedKeys = new Set(places.map((place) => place.key));

  return (
    <>
      <input name="regionCode" type="hidden" value={region?.code ?? ""} />
      <input name="regionLabel" type="hidden" value={region?.label ?? ""} />
      <input name="regionName" type="hidden" value={region?.fullName ?? ""} />
      <input name="places" type="hidden" value={JSON.stringify(places.map((place) => place.reference))} />

      <Field data-invalid={Boolean(regionError)}>
        <FieldLabel>
          <MapPinAreaIcon strokeWidth={2} className={FIELD_ICON} aria-hidden="true" />
          어느 지역에 갔나요? <span className="font-[650] text-[11px] text-foreground">필수</span>
        </FieldLabel>
        <RegionPickerDialog
          aria-describedby={regionError ? "regionCode-error" : undefined}
          aria-invalid={Boolean(regionError)}
          onSelect={selectRegion}
          region={region}
        />
        <FieldError id="regionCode-error">{regionError}</FieldError>
      </Field>

      <Field data-invalid={Boolean(placeError)}>
        <FieldLabel>
          <MapPinIcon strokeWidth={2} className={FIELD_ICON} aria-hidden="true" />
          방문 장소 <span className="font-[650] text-[11px] text-muted-foreground">선택</span>
        </FieldLabel>
        <FieldDescription>최대 10곳까지 추가할 수 있어요.</FieldDescription>

        {places.length ? (
          <ul className="flex flex-col gap-2">
            {places.map((place) => {
              const saveChecked = place.saved || place.reference.save;
              return (
                <li className="rounded-xl border bg-card p-3" key={place.key}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{place.name}</p>
                      <p className="mt-1 text-muted-foreground text-xs">{place.address ?? "주소 정보 없음"}</p>
                    </div>
                    <IconButton
                      aria-label={`${place.name} 방문 장소에서 제거`}
                      icon={TrashIcon}
                      iconStrokeWidth={2}
                      onClick={() => {
                        setPlaces((current) => current.filter((item) => item.key !== place.key));
                        onChange?.();
                      }}
                      size="sm"
                      type="button"
                    />
                  </div>
                  <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm" htmlFor={`save-${place.key}`}>
                    <Checkbox
                      checked={saveChecked}
                      disabled={place.saved}
                      id={`save-${place.key}`}
                      onCheckedChange={(checked) => toggleSave(place.key, checked)}
                    />
                    {place.saved ? "내 장소에 저장됨" : "기록을 저장할 때 내 장소에도 추가"}
                  </label>
                </li>
              );
            })}
          </ul>
        ) : null}

        <PlacePickerDialog
          disabled={places.length >= 10}
          onAdd={addPlace}
          region={region}
          savedPlaces={savedPlaces}
          selectedKeys={selectedKeys}
        />
        <FieldError id="places-error">{placeError}</FieldError>
      </Field>
    </>
  );
}
