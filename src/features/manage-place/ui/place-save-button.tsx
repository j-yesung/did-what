"use client";

import { useActionState } from "react";

import { BookmarkCheckIcon, BookmarkIcon, CircleAlertIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";

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
  const label = currentSaved ? (saved ? "내 장소에서 해제" : "내 장소에 저장됨") : "내 장소에 저장";
  const icon = currentSaved ? (
    <BookmarkCheckIcon aria-hidden="true" data-icon={iconOnly ? undefined : "inline-start"} />
  ) : (
    <BookmarkIcon aria-hidden="true" data-icon={iconOnly ? undefined : "inline-start"} />
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
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
      {state.status === "error" ? (
        <Alert variant="destructive">
          <CircleAlertIcon aria-hidden="true" />
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
    </form>
  );
}
