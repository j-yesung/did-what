"use client";

import { useActionState } from "react";

import { CheckIcon, CircleAlertIcon, PlusIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";

import { createPlace } from "../model/actions";
import { INITIAL_PLACE_ACTION_STATE } from "../model/place-form";

type CreatePlaceFormProps = {
  page: number;
  placeId: string;
  query: string;
  saved: boolean;
};

export function CreatePlaceForm({ page, placeId, query, saved }: CreatePlaceFormProps) {
  const [state, formAction, pending] = useActionState(createPlace, INITIAL_PLACE_ACTION_STATE);
  const isSaved = saved || state.status === "success";

  return (
    <form action={formAction} className="flex w-full flex-col gap-2">
      <input name="page" type="hidden" value={page} />
      <input name="placeId" type="hidden" value={placeId} />
      <input name="query" type="hidden" value={query} />
      <Button className="w-full" disabled={pending || isSaved} type="submit" variant={isSaved ? "outline" : "default"}>
        {pending ? (
          <Spinner aria-label="장소 저장 중" data-icon="inline-start" />
        ) : isSaved ? (
          <CheckIcon data-icon="inline-start" />
        ) : (
          <PlusIcon data-icon="inline-start" />
        )}
        {pending ? "저장 중..." : isSaved ? "저장됨" : "이 장소 저장"}
      </Button>
      {state.status === "error" ? (
        <Alert variant="destructive">
          <CircleAlertIcon aria-hidden="true" />
          <AlertTitle>저장하지 못했어요</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
    </form>
  );
}
