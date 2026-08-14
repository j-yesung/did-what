"use client";

import { useState } from "react";

import { MapPinIcon, MapPinnedIcon, Trash2Icon } from "lucide-react";

import type { PlaceOption } from "@/entities/place";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/shared/ui/field";

import type { RecordLocationPlace, RecordLocationRegion } from "../model/location-picker";
import { PlacePickerDialog } from "./place-picker-dialog";
import { RegionPickerDialog } from "./region-picker-dialog";

const FIELD_ICON = "size-[18px] text-foreground [stroke-width:2]";

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
  const [pendingRegion, setPendingRegion] = useState<RecordLocationRegion | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function selectRegion(nextRegion: RecordLocationRegion) {
    if (nextRegion.code === region?.code) return;
    if (places.length === 0) {
      setRegion(nextRegion);
      onChange?.();
      return;
    }

    setPendingRegion(nextRegion);
    setConfirmOpen(true);
  }

  function confirmRegionChange() {
    if (pendingRegion) setRegion(pendingRegion);
    setPlaces([]);
    setPendingRegion(null);
    setConfirmOpen(false);
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
          <MapPinnedIcon className={FIELD_ICON} aria-hidden="true" />
          어느 지역에 갔나요? <span className="font-[650] text-[11px] text-foreground">필수</span>
        </FieldLabel>
        {region ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/40 p-3">
            <div className="min-w-0">
              <p className="font-medium text-sm">{region.label}</p>
              <p className="mt-1 text-muted-foreground text-xs">{region.fullName}</p>
            </div>
            <RegionPickerDialog onSelect={selectRegion} />
          </div>
        ) : (
          <RegionPickerDialog onSelect={selectRegion} />
        )}
        <FieldError id="regionCode-error">{regionError}</FieldError>
      </Field>

      <Field data-invalid={Boolean(placeError)}>
        <FieldLabel>
          <MapPinIcon className={FIELD_ICON} aria-hidden="true" />
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
                    <Button
                      aria-label={`${place.name} 방문 장소에서 제거`}
                      onClick={() => {
                        setPlaces((current) => current.filter((item) => item.key !== place.key));
                        onChange?.();
                      }}
                      size="icon-sm"
                      type="button"
                      variant="ghost"
                    >
                      <Trash2Icon aria-hidden="true" />
                    </Button>
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

      <AlertDialog onOpenChange={setConfirmOpen} open={confirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>지역을 변경할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              {`선택한 방문 장소 ${places.length}곳이 모두 해제돼요.\n내 장소에 이미 저장된 곳은 사라지지 않아요.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRegionChange} type="button">
              지역 변경
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
