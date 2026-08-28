"use client";

import { useRef } from "react";

import { placesQueryOptions } from "@/entities/place/api/places-query";
import { useActionMutation } from "@/shared/lib/server-action/use-action-mutation";
import { Button } from "@/shared/ui/button";

import { createPlaces } from "../model/actions";
import type { CreatePlaceInput } from "../model/place-form";

type PlaceSearchSaveButtonProps = {
  onSaved?: (placeIds: string[]) => void;
  selections: CreatePlaceInput[];
};

export function PlaceSearchSaveButton({ onSaved, selections }: PlaceSearchSaveButtonProps) {
  const pendingPlaceIds = useRef<string[]>([]);
  const save = useActionMutation(createPlaces, {
    error: "저장하지 못했어요",
    invalidate: [placesQueryOptions.queryKey],
    onSuccess: () => onSaved?.(pendingPlaceIds.current),
    success: `${selections.length}곳을 내 장소에 저장했어요`,
  });

  function handleSave() {
    pendingPlaceIds.current = selections.map(({ placeId }) => placeId);
    save.mutate(selections);
  }

  return (
    <Button fullWidth loading={save.isPending} onClick={handleSave} size="large" type="button">
      장소 {selections.length}개 저장
    </Button>
  );
}
