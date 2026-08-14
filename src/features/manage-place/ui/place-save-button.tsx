"use client";

import { useActionMutation } from "@/shared/lib/server-action/use-action-mutation";
import { Button } from "@/shared/ui/button";

import { savePlace } from "../model/actions";

type PlaceSaveButtonProps = {
  placeId: string;
};

export function PlaceSaveButton({ placeId }: PlaceSaveButtonProps) {
  const save = useActionMutation(() => savePlace(placeId), {
    error: "저장하지 못했어요",
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
