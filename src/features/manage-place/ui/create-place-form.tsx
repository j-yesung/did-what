"use client";

import { useActionMutation } from "@/shared/lib/server-action/use-action-mutation";
import { Button } from "@/shared/ui/button";

import { createPlace } from "../model/actions";

type CreatePlaceFormProps = {
  page: number;
  placeId: string;
  query: string;
  saved: boolean;
};

export function CreatePlaceForm({ page, placeId, query, saved }: CreatePlaceFormProps) {
  const save = useActionMutation(createPlace, { error: "저장하지 못했어요", success: "내 장소에 저장했어요" });
  const isSaved = saved || save.data?.status === "success";

  return (
    <form
      className="flex w-full flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate(new FormData(event.currentTarget));
      }}
    >
      <input name="page" type="hidden" value={page} />
      <input name="placeId" type="hidden" value={placeId} />
      <input name="query" type="hidden" value={query} />
      <Button
        className="w-full"
        disabled={isSaved}
        loading={save.isPending}
        type="submit"
        variant={isSaved ? "outline" : "default"}
      >
        {isSaved ? "저장됨" : "이 장소 저장"}
      </Button>
    </form>
  );
}
