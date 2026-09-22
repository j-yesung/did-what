"use client";

import { useState } from "react";

import { getPlaceRegionLabel, type SavedPlaceRow } from "@/entities/place";
import { DeletePlaceConfirm } from "@/features/place/delete-place/ui/delete-place-confirm";
import { Button } from "@/shared/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/shared/ui/drawer";
import { PressLink } from "@/shared/ui/press-link";

type PlaceActionSheetProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  place: SavedPlaceRow | null;
};

export function PlaceActionSheet({ onOpenChange, open, place }: PlaceActionSheetProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const recordCount = place?.record_places[0]?.count ?? 0;

  return (
    <>
      <Drawer onOpenChange={onOpenChange} open={open} showSwipeHandle>
        <DrawerContent className="[--drawer-height:auto]">
          <DrawerHeader className="gap-1 px-5 pt-5 pb-4 text-left group-data-[swipe-axis=y]/drawer-popup:text-left">
            <DrawerTitle className="line-clamp-2 break-keep font-bold text-xl leading-7">{place?.name}</DrawerTitle>
            <DrawerDescription className="text-left text-sm leading-5">
              {place
                ? [
                    getPlaceRegionLabel(place.region_name, place.address),
                    recordCount > 0 ? `기록 ${recordCount}개` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : null}
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex gap-2 px-5 pb-5 *:flex-1">
            <Button
              color="dark"
              nativeButton={false}
              render={<PressLink href={`/places/${place?.id}`} />}
              size="large"
              variant="weak"
            >
              상세 보기
            </Button>
            <Button
              color="danger"
              onClick={() => {
                onOpenChange(false);
                setConfirmOpen(true);
              }}
              size="large"
              variant="weak"
            >
              삭제하기
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      <DeletePlaceConfirm
        name={place?.name ?? ""}
        onClose={() => setConfirmOpen(false)}
        open={confirmOpen}
        placeId={place?.id ?? ""}
        recordCount={recordCount}
      />
    </>
  );
}
