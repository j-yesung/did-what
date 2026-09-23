"use client";

import { useState } from "react";

import { getPlaceRegionLabel, type SavedPlaceRow } from "@/entities/place";
import { DeletePlaceConfirm } from "@/features/place/delete-place/ui/delete-place-confirm";
import { ActionSheet } from "@/shared/ui/action-sheet";
import { Button } from "@/shared/ui/button";
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
      <ActionSheet
        description={
          place
            ? [getPlaceRegionLabel(place.region_name, place.address), recordCount > 0 ? `기록 ${recordCount}개` : null]
                .filter(Boolean)
                .join(" · ")
            : null
        }
        onOpenChange={onOpenChange}
        open={open}
        title={place?.name}
      >
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
      </ActionSheet>

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
