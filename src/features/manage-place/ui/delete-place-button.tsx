"use client";

import { useState } from "react";

import { TrashIcon } from "@phosphor-icons/react";

import { placesQueryOptions } from "@/entities/place/api/places-query";
import { useActionMutation } from "@/shared/lib/server-action/use-action-mutation";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";

import { deletePlace } from "../model/actions";

type DeletePlaceButtonProps = {
  iconOnly?: boolean;
  name: string;
  placeId: string;
  recordCount: number;
};

export function DeletePlaceButton({ iconOnly, name, placeId, recordCount }: DeletePlaceButtonProps) {
  const [open, setOpen] = useState(false);

  const remove = useActionMutation(() => deletePlace(placeId), {
    error: "장소를 삭제하지 못했어요",
    invalidate: [placesQueryOptions.queryKey],
    success: "장소를 삭제했어요",
  });

  return (
    <>
      {iconOnly ? (
        <Button
          aria-label={`${name} 삭제`}
          className="size-11 text-destructive [&_svg]:size-4"
          onClick={() => setOpen(true)}
          size="icon-lg"
          variant="ghost"
        >
          <TrashIcon strokeWidth={2} aria-hidden="true" />
        </Button>
      ) : (
        <Button className="w-full" onClick={() => setOpen(true)} variant="destructive">
          장소 삭제
        </Button>
      )}
      <ConfirmDialog
        cancelButton={
          <Button disabled={remove.isPending} onClick={() => setOpen(false)} variant="neutral">
            취소
          </Button>
        }
        confirmButton={
          <Button loading={remove.isPending} onClick={() => remove.mutate()} variant="destructive">
            장소 삭제
          </Button>
        }
        description={
          recordCount > 0
            ? `이곳의 기록 ${recordCount}개에서 방문 장소만 빠지고 기록 자체는 남아요.\n되돌릴 수 없어요.`
            : "삭제한 뒤에는 되돌릴 수 없어요."
        }
        onClose={() => setOpen(false)}
        open={open}
        title={`${name}을(를) 삭제할까요?`}
      />
    </>
  );
}
