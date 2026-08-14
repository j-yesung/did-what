"use client";

import { useActionState } from "react";

import { BookmarkCheckIcon, BookmarkIcon } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { useActionToast } from "@/shared/ui/toast";

import { setPlaceSaved } from "../model/actions";
import { INITIAL_PLACE_ACTION_STATE } from "../model/place-form";

type PlaceSaveButtonProps = {
  iconOnly?: boolean;
  placeId: string;
  saved: boolean;
};

export function PlaceSaveButton({ iconOnly, placeId, saved }: PlaceSaveButtonProps) {
  const [state, formAction, pending] = useActionState(
    setPlaceSaved.bind(null, placeId, !saved),
    INITIAL_PLACE_ACTION_STATE,
  );
  const currentSaved = state.saved ?? saved;

  useActionToast(state, {
    error: "바꾸지 못했어요",
    success: saved ? "내 장소에서 해제했어요" : "내 장소에 저장했어요",
  });

  const label = currentSaved ? (saved ? "내 장소에서 해제" : "내 장소에 저장됨") : "내 장소에 저장";
  const icon = currentSaved ? (
    <BookmarkCheckIcon aria-hidden="true" data-icon={iconOnly ? undefined : "inline-start"} />
  ) : (
    <BookmarkIcon aria-hidden="true" data-icon={iconOnly ? undefined : "inline-start"} />
  );

  return (
    <form action={formAction}>
      {iconOnly ? (
        <Button
          aria-label={label}
          className="size-11 text-foreground [&_svg]:size-[18px]"
          disabled={state.status === "success"}
          loading={pending}
          size="icon-lg"
          type="submit"
          variant="ghost"
        >
          {icon}
        </Button>
      ) : (
        <Button disabled={state.status === "success"} loading={pending} type="submit" variant="outline">
          {icon}
          {label}
        </Button>
      )}
    </form>
  );
}
