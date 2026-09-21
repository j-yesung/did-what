"use client";

import { Trash2Icon } from "@animateicons/react/lucide";

import { placesQueryOptions } from "@/entities/place";
import { RECORDS_QUERY_KEY } from "@/entities/record";
import { RECORD_COMMENTS_QUERY_KEY } from "@/entities/record-comment";
import { useActionMutation } from "@/shared/lib/server-action/use-action-mutation";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog, ConfirmDialogCancelButton } from "@/shared/ui/confirm-dialog";

import { deleteRecord } from "../api/delete-record";

type DeleteRecordConfirmProps = {
  activity: string;
  onClose: () => void;
  onDeleted?: () => void;
  open: boolean;
  recordId: string;
};

export function DeleteRecordConfirm({ activity, onClose, onDeleted, open, recordId }: DeleteRecordConfirmProps) {
  const remove = useActionMutation(() => deleteRecord(recordId), {
    error: "기록을 삭제하지 못했어요",
    icon: Trash2Icon,
    invalidate: [RECORDS_QUERY_KEY, RECORD_COMMENTS_QUERY_KEY, placesQueryOptions.queryKey],
    success: "기록을 삭제했어요",
    onSuccess: () => {
      onClose();
      onDeleted?.();
    },
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
          기록 삭제
        </Button>
      }
      description="이 기록과 댓글은 삭제한 뒤 되돌릴 수 없어요."
      onClose={onClose}
      open={open}
      title={`“${activity}” 기록을 삭제할까요?`}
    />
  );
}
