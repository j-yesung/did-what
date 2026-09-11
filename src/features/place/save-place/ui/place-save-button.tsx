"use client";

import { startTransition, useOptimistic, useRef } from "react";

import { BookmarkIcon, type BookmarkIconHandle } from "@animateicons/react/lucide";

import { placesQueryOptions } from "@/entities/place";
import { RECORD_DETAILS_QUERY_KEY } from "@/entities/record";
import { useActionMutation } from "@/shared/lib/server-action/use-action-mutation";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

import { setPlaceSaved } from "../api/save-place";

type PlaceSaveButtonProps = {
  placeId: string;
  placeName: string;
  saved: boolean;
};

export function PlaceSaveButton({ placeId, placeName, saved }: PlaceSaveButtonProps) {
  const bookmarkRef = useRef<BookmarkIconHandle>(null);
  const [optimisticSaved, setOptimisticSaved] = useOptimistic(saved);

  const toggle = useActionMutation((nextSaved: boolean) => setPlaceSaved(placeId, nextSaved), {
    error: "장소 저장 상태를 변경하지 못했어요",
    icon: BookmarkIcon,
    invalidate: [placesQueryOptions.queryKey, RECORD_DETAILS_QUERY_KEY],
  });

  const handleToggle = () => {
    if (toggle.isPending) return;

    const nextSaved = !optimisticSaved;

    startTransition(async () => {
      setOptimisticSaved(nextSaved);
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) bookmarkRef.current?.startAnimation();
      await toggle.mutateAsync(nextSaved).catch(() => undefined);
    });
  };

  return (
    <Button
      aria-label={`${placeName} ${optimisticSaved ? "내 장소에서 제거" : "내 장소에 저장"}`}
      aria-pressed={optimisticSaved}
      className={cn(
        "size-11 min-w-0 p-0 disabled:opacity-100",
        optimisticSaved ? "text-bookmark [&_svg]:fill-bookmark" : "text-muted-foreground [&_svg]:fill-transparent",
        "[&_svg]:size-6 [&_svg]:transition-colors [&_svg]:duration-200 [&_svg]:ease-[cubic-bezier(0.23,1,0.32,1)]",
      )}
      disabled={toggle.isPending}
      onClick={handleToggle}
      size="medium"
      type="button"
      variant="ghost"
    >
      <BookmarkIcon isAnimated={false} ref={bookmarkRef} />
    </Button>
  );
}
