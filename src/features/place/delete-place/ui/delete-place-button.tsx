"use client";

import { useState } from "react";

import { BookmarkXIcon } from "@animateicons/react/lucide";
import { TrashIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

import { placesQueryOptions } from "@/entities/place";
import { RECORD_PLACES_QUERY_KEY } from "@/entities/record";
import { useActionMutation } from "@/shared/lib/server-action/use-action-mutation";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog, ConfirmDialogCancelButton } from "@/shared/ui/confirm-dialog";
import { IconButton } from "@/shared/ui/icon-button";

import { deletePlace } from "../api/delete-place";

type DeletePlaceButtonProps = {
  name: string;
  placeId: string;
  recordCount: number;
};

export function DeletePlaceButton({ name, placeId, recordCount }: DeletePlaceButtonProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const remove = useActionMutation(() => deletePlace(placeId), {
    error: "장소를 삭제하지 못했어요",
    icon: BookmarkXIcon,
    invalidate: [placesQueryOptions.queryKey, RECORD_PLACES_QUERY_KEY],
    onSuccess: () => router.replace("/places"),
    success: "장소를 삭제했어요",
  });

  return (
    <>
      <IconButton
        aria-label={`${name} 삭제`}
        className="text-destructive"
        icon={TrashIcon}
        iconSize={16}
        iconStrokeWidth={2}
        onClick={() => setOpen(true)}
      />
      <ConfirmDialog
        cancelButton={
          <ConfirmDialogCancelButton disabled={remove.isPending} onClick={() => setOpen(false)}>
            취소
          </ConfirmDialogCancelButton>
        }
        confirmButton={
          <Button color="danger" loading={remove.isPending} onClick={() => remove.mutate()} variant="fill">
            장소 삭제
          </Button>
        }
        description={
          recordCount > 0
            ? `저장된 장소 목록에서만 삭제되고 기록 ${recordCount}개의 방문 장소는 남아요.`
            : "저장된 장소 목록에서 삭제돼요."
        }
        onClose={() => setOpen(false)}
        open={open}
        title={`${name}을(를) 삭제할까요?`}
      />
    </>
  );
}
