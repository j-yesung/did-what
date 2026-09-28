"use client";

import { useState } from "react";

import type { PlaceOption } from "@/entities/place";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { Button } from "@/shared/ui/button";
import { SearchField } from "@/shared/ui/search-field";

import {
  type RecordLocationPlace,
  type RecordLocationRegion,
  toExistingRecordLocationPlace,
} from "../model/location-picker";
import { SelectablePlaceCard } from "./selectable-place-card";

type SavedPlacePickerBottomSheetProps = {
  disabled?: boolean;
  maxSelectionCount: number;
  onAdd: (places: RecordLocationPlace[]) => void;
  regions: RecordLocationRegion[];
  savedPlaces: PlaceOption[];
  selectedKeys: Set<string>;
};

export function SavedPlacePickerBottomSheet({
  disabled,
  maxSelectionCount,
  onAdd,
  regions,
  savedPlaces,
  selectedKeys,
}: SavedPlacePickerBottomSheetProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const normalizedQuery = query.trim().toLocaleLowerCase("ko-KR");
  const inRegion = (place: PlaceOption) =>
    regions.some((region) => place.region_code.slice(0, 5) === region.code.slice(0, 5));
  const filteredPlaces = [...savedPlaces]
    // 지역명이 없는 옛 장소는 방문 지역을 정할 수 없어 목록에서 뺀다.
    .filter((place) => Boolean(place.region_name))
    .sort((a, b) => Number(inRegion(b)) - Number(inRegion(a)))
    .filter((place) => {
      if (!normalizedQuery) return true;
      return [place.name, place.address, place.region_name]
        .filter(Boolean)
        .some((value) => value?.toLocaleLowerCase("ko-KR").includes(normalizedQuery));
    });

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setQuery("");
      setSelectedIds(new Set());
    }
  };

  const togglePlace = (placeId: string, checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(placeId);
      else next.delete(placeId);
      return next;
    });
  };

  const addSelectedPlaces = () => {
    const places = savedPlaces
      .filter((place) => selectedIds.has(place.id) && place.region_name)
      .map((place) => toExistingRecordLocationPlace(place));
    onAdd(places);
    setOpen(false);
    setQuery("");
    setSelectedIds(new Set());
  };

  return (
    <BottomSheet onOpenChange={handleOpenChange} open={open} showSwipeHandle>
      <BottomSheet.Trigger
        disabled={disabled}
        render={<Button disabled={disabled} fullWidth size="large" type="button" variant="neutral" />}
      >
        내 장소에서 추가
      </BottomSheet.Trigger>
      <BottomSheet.VirtualKeyboardProvider>
        <BottomSheet.Content className="[--drawer-height:var(--drawer-content-max-height)]">
          <BottomSheet.Header>
            <BottomSheet.Title className="sr-only">내 장소에서 추가</BottomSheet.Title>
            <BottomSheet.Description>
              기록에 추가할 장소를 최대 {maxSelectionCount}곳까지 선택하세요.
            </BottomSheet.Description>
          </BottomSheet.Header>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden px-5 pt-4 pb-0">
            <SearchField
              aria-label="저장한 장소 검색"
              maxLength={100}
              onValueChange={setQuery}
              placeholder="장소 이름 또는 주소 검색"
              value={query}
            />

            {filteredPlaces.length ? (
              <ul
                aria-label="저장한 장소"
                className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden overscroll-contain p-1"
              >
                {filteredPlaces.map((place) => {
                  const added = selectedKeys.has(`existing:${place.id}`);
                  const selected = selectedIds.has(place.id);
                  const selectionLimitReached = selectedIds.size >= maxSelectionCount && !selected;
                  const disabled = added || selectionLimitReached;

                  return (
                    <SelectablePlaceCard
                      added={added}
                      address={place.address ?? place.region_name ?? "주소 정보 없음"}
                      checkboxDisabled={selectionLimitReached}
                      disabled={disabled}
                      key={place.id}
                      label="내 장소"
                      name={place.name}
                      onSelect={() => togglePlace(place.id, !selected)}
                      selected={selected}
                    />
                  );
                })}
              </ul>
            ) : (
              <p className="py-8 text-center text-muted-foreground text-sm">일치하는 저장 장소가 없어요.</p>
            )}
          </div>

          <BottomSheet.Footer>
            <Button disabled={selectedIds.size === 0} fullWidth onClick={addSelectedPlaces} size="large" type="button">
              {selectedIds.size > 0 ? `${selectedIds.size}곳 추가` : "장소 선택"}
            </Button>
          </BottomSheet.Footer>
        </BottomSheet.Content>
      </BottomSheet.VirtualKeyboardProvider>
    </BottomSheet>
  );
}
