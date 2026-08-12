"use client";

import { useActionState } from "react";

import { BookmarkCheckIcon, BookmarkIcon, CircleAlertIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";

import { setPlaceSaved } from "../model/actions";
import { INITIAL_CREATE_PLACE_STATE } from "../model/place-form";

type PlaceSaveButtonProps = {
  placeId: string;
  saved: boolean;
};

export function PlaceSaveButton({ placeId, saved }: PlaceSaveButtonProps) {
  const [state, formAction, pending] = useActionState(
    setPlaceSaved.bind(null, placeId, !saved),
    INITIAL_CREATE_PLACE_STATE,
  );
  const currentSaved = state.saved ?? saved;

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <Button disabled={pending || state.status === "success"} type="submit" variant="outline">
        {pending ? (
          <Spinner aria-label="장소 저장 상태 변경 중" data-icon="inline-start" />
        ) : currentSaved ? (
          <BookmarkCheckIcon aria-hidden="true" data-icon="inline-start" />
        ) : (
          <BookmarkIcon aria-hidden="true" data-icon="inline-start" />
        )}
        {pending ? "변경 중..." : currentSaved ? (saved ? "내 장소에서 해제" : "내 장소에 저장됨") : "내 장소에 저장"}
      </Button>
      {state.status === "error" ? (
        <Alert variant="destructive">
          <CircleAlertIcon aria-hidden="true" />
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
    </form>
  );
}
