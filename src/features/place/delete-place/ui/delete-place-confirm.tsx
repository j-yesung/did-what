"use client";

import { placesQueryOptions } from "@/entities/place";
import { RECORD_DETAILS_QUERY_KEY } from "@/entities/record";
import { useActionMutation } from "@/shared/lib/server-action/use-action-mutation";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog, ConfirmDialogCancelButton } from "@/shared/ui/confirm-dialog";

import { deletePlace } from "../api/delete-place";

type DeletePlaceConfirmProps = {
  name: string;
  onClose: () => void;
  onDeleted?: () => void;
  open: boolean;
  placeId: string;
  recordCount: number;
};

export function DeletePlaceConfirm({ name, onClose, onDeleted, open, placeId, recordCount }: DeletePlaceConfirmProps) {
  const remove = useActionMutation(() => deletePlace(placeId), {
    error: "장소를 삭제하지 못했어요",
    invalidate: [placesQueryOptions.queryKey, RECORD_DETAILS_QUERY_KEY],
    onSuccess: () => {
      onClose();
      onDeleted?.();
    },
    success: "장소를 삭제했어요",
  });

  return (
    <ConfirmDialog
      cancelButton={
        <ConfirmDialogCancelButton disabled={remove.isPending} onClick={onClose}>
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
      onClose={onClose}
      open={open}
      title={`${name}을(를) 삭제할까요?`}
    />
  );
}
