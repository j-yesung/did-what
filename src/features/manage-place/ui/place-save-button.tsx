"use client";

import { BookmarkCheckIcon, BookmarkIcon } from "lucide-react";

import { useActionMutation } from "@/shared/lib/server-action/use-action-mutation";
import { Button } from "@/shared/ui/button";

import { setPlaceSaved } from "../model/actions";

type PlaceSaveButtonProps = {
  iconOnly?: boolean;
  placeId: string;
  saved: boolean;
};

export function PlaceSaveButton({ iconOnly, placeId, saved }: PlaceSaveButtonProps) {
  const toggle = useActionMutation(() => setPlaceSaved(placeId, !saved), {
    error: "바꾸지 못했어요",
    success: saved ? "내 장소에서 해제했어요" : "내 장소에 저장했어요",
  });
  const currentSaved = toggle.data?.saved ?? saved;

  const label = currentSaved ? (saved ? "내 장소에서 해제" : "내 장소에 저장됨") : "내 장소에 저장";
  const icon = currentSaved ? (
    <BookmarkCheckIcon aria-hidden="true" data-icon={iconOnly ? undefined : "inline-start"} />
  ) : (
    <BookmarkIcon aria-hidden="true" data-icon={iconOnly ? undefined : "inline-start"} />
  );

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        toggle.mutate();
      }}
    >
      {iconOnly ? (
        <Button
          aria-label={label}
          className="size-11 text-foreground [&_svg]:size-[18px]"
          disabled={toggle.isSuccess}
          loading={toggle.isPending}
          size="icon-lg"
          type="submit"
          variant="ghost"
        >
          {icon}
        </Button>
      ) : (
        <Button disabled={toggle.isSuccess} loading={toggle.isPending} type="submit" variant="outline">
          {icon}
          {label}
        </Button>
      )}
    </form>
  );
}
