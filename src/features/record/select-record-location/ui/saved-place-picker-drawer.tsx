"use client";

import { type KeyboardEvent, useState } from "react";

import { BookmarkIcon } from "@phosphor-icons/react";

import type { PlaceOption } from "@/entities/place";
import { FOCUS_RING } from "@/shared/lib/interaction";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerVirtualKeyboardProvider,
} from "@/shared/ui/drawer";
import { SearchField } from "@/shared/ui/search-field";

import type { RecordLocationPlace, RecordLocationRegion } from "../model/location-picker";

type SavedPlacePickerDrawerProps = {
  disabled?: boolean;
  maxSelectionCount: number;
  onAdd: (places: RecordLocationPlace[]) => void;
  region: RecordLocationRegion | null;
  savedPlaces: PlaceOption[];
  selectedKeys: Set<string>;
};

export function SavedPlacePickerDrawer({
  disabled,
  maxSelectionCount,
  onAdd,
  region,
  savedPlaces,
  selectedKeys,
}: SavedPlacePickerDrawerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const normalizedQuery = query.trim().toLocaleLowerCase("ko-KR");
  const inRegion = (place: PlaceOption) => region && place.region_code.slice(0, 5) === region.code.slice(0, 5);
  const filteredPlaces = [...savedPlaces]
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

  const handlePlaceKeyDown = (event: KeyboardEvent<HTMLLIElement>, placeId: string, selected: boolean) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    togglePlace(placeId, !selected);
  };

  const addSelectedPlaces = () => {
    const places = savedPlaces
      .filter((place) => selectedIds.has(place.id))
      .map(
        (place): RecordLocationPlace => ({
          address: place.address,
          key: `existing:${place.id}`,
          name: place.name,
          reference: { kind: "existing", placeId: place.id, save: false },
        }),
      );
    onAdd(places);
    setOpen(false);
    setQuery("");
    setSelectedIds(new Set());
  };

  return (
    <Drawer onOpenChange={handleOpenChange} open={open} showSwipeHandle>
      <DrawerTrigger
        disabled={disabled}
        render={<Button disabled={disabled} fullWidth size="large" type="button" variant="neutral" />}
      >
        <BookmarkIcon aria-hidden="true" data-icon="inline-start" />내 장소에서 추가
      </DrawerTrigger>
      <DrawerVirtualKeyboardProvider>
        <DrawerContent className="[--drawer-height:var(--drawer-content-max-height)]">
          <DrawerHeader>
            <DrawerTitle>내 장소에서 추가</DrawerTitle>
            <DrawerDescription>기록에 추가할 장소를 최대 {maxSelectionCount}곳까지 선택하세요.</DrawerDescription>
          </DrawerHeader>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden p-4 pb-0">
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
                    <li
                      aria-checked={added || selected}
                      aria-disabled={disabled}
                      className={cn(
                        "w-full min-w-0 rounded-xl transition-transform duration-200 active:scale-[0.99]",
                        FOCUS_RING,
                        disabled ? "cursor-default" : "cursor-pointer",
                      )}
                      key={place.id}
                      onClick={() => {
                        if (!disabled) togglePlace(place.id, !selected);
                      }}
                      onKeyDown={(event) => {
                        if (!disabled) handlePlaceKeyDown(event, place.id, selected);
                      }}
                      role="checkbox"
                      tabIndex={disabled ? -1 : 0}
                    >
                      <Card
                        className={cn(
                          "w-full min-w-0 transition-[background-color,box-shadow] duration-200",
                          selected && "bg-secondary ring-2 ring-primary/40 dark:bg-pressed dark:ring-foreground/15",
                        )}
                        data-selected={selected}
                        size="sm"
                      >
                        <CardHeader className="min-w-0 grid-cols-[minmax(0,1fr)_auto]">
                          <CardTitle className="min-w-0 truncate">{place.name}</CardTitle>
                          <CardDescription>내 장소</CardDescription>
                          <CardAction>
                            {added ? (
                              <Badge>추가됨</Badge>
                            ) : (
                              <Checkbox
                                aria-hidden="true"
                                checked={selected}
                                className="pointer-events-none size-6"
                                disabled={selectionLimitReached}
                                tabIndex={-1}
                                variant="circle"
                              />
                            )}
                          </CardAction>
                        </CardHeader>
                        <CardContent>
                          <p className="wrap-break-word text-muted-foreground text-sm">
                            {place.address ?? place.region_name ?? "주소 정보 없음"}
                          </p>
                        </CardContent>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="py-8 text-center text-muted-foreground text-sm">일치하는 저장 장소가 없어요.</p>
            )}
          </div>

          <DrawerFooter className="pb-[max(--spacing(4),env(safe-area-inset-bottom))]">
            <Button disabled={selectedIds.size === 0} fullWidth onClick={addSelectedPlaces} size="large" type="button">
              {selectedIds.size > 0 ? `${selectedIds.size}곳 추가` : "장소 선택"}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </DrawerVirtualKeyboardProvider>
    </Drawer>
  );
}
