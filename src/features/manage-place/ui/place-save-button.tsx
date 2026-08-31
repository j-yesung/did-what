"use client";

import { BookmarkCheckIcon } from "@animateicons/react/lucide";

import { placesQueryOptions } from "@/entities/place/api/places-query";
import { useActionMutation } from "@/shared/lib/server-action/use-action-mutation";
import { Button } from "@/shared/ui/button";

import { setPlaceSaved } from "../model/actions";

type Props = {
  placeId: string;
};

export function PlaceSaveButton({ placeId }: Props) {
  const save = useActionMutation(() => setPlaceSaved(placeId, true), {
    error: "저장하지 못했어요",
    icon: BookmarkCheckIcon,
    invalidate: [placesQueryOptions.queryKey],
    success: "내 장소에 저장했어요",
  });

  return (
    <Button
      disabled={save.isSuccess}
      loading={save.isPending}
      onClick={() => save.mutate()}
      type="button"
      variant="outline"
    >
      {save.isSuccess ? "내 장소에 저장됨" : "내 장소에 저장"}
    </Button>
  );
}
