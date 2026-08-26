"use client";

import { useOptimistic, useTransition } from "react";

import { BookmarkSimpleIcon } from "@phosphor-icons/react";

import { placesQueryOptions } from "@/entities/place/api/places-query";
import { useActionMutation } from "@/shared/lib/server-action/use-action-mutation";
import { cn } from "@/shared/lib/utils";
import { IconButton } from "@/shared/ui/icon-button";

import { createPlace, setPlaceSaved } from "../model/actions";

type PlaceSearchSaveToggleProps = {
  page: number;
  placeId: string;
  query: string;
  savedPlaceId?: string;
};

export function PlaceSearchSaveToggle({ page, placeId, query, savedPlaceId }: PlaceSearchSaveToggleProps) {
  const save = useActionMutation(createPlace, {
    error: "저장하지 못했어요",
    invalidate: [placesQueryOptions.queryKey],
    success: "내 장소에 저장했어요",
  });

  const unsave = useActionMutation(() => setPlaceSaved(savedPlaceId ?? "", false), {
    error: "저장 해제하지 못했어요",
    invalidate: [placesQueryOptions.queryKey],
    success: "장소 저장을 해제했어요",
  });
  const [isSaved, setOptimisticSaved] = useOptimistic(Boolean(savedPlaceId));
  const [, startTransition] = useTransition();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const nextSaved = !isSaved;
        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
          setOptimisticSaved(nextSaved);
          if (nextSaved) await save.mutateAsync(formData).catch(() => undefined);
          else await unsave.mutateAsync().catch(() => undefined);
        });
      }}
    >
      <input name="page" type="hidden" value={page} />
      <input name="placeId" type="hidden" value={placeId} />
      <input name="query" type="hidden" value={query} />
      <IconButton
        aria-label={isSaved ? "장소 저장 해제" : "장소 저장"}
        aria-pressed={isSaved}
        className={cn(isSaved && "text-bookmark")}
        icon={BookmarkSimpleIcon}
        iconSize={24}
        iconWeight={isSaved ? "fill" : "regular"}
        title={isSaved ? "저장 해제" : "저장"}
        type="submit"
      />
    </form>
  );
}
