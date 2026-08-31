"use client";

import { useState } from "react";

import { Trash2Icon } from "@animateicons/react/lucide";

import { placesQueryOptions } from "@/entities/place/api/places-query";
import { recordsQueryOptions } from "@/entities/record/api/records-query";
import { useGoBack } from "@/shared/lib/navigation/use-go-back";
import { useActionMutation } from "@/shared/lib/server-action/use-action-mutation";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";

import { deleteRecord } from "../model/actions";

type DeleteRecordButtonProps = {
  activity: string;
  recordId: string;
};

export function DeleteRecordButton({ activity, recordId }: DeleteRecordButtonProps) {
  const [open, setOpen] = useState(false);
  const goBackTo = useGoBack();

  const remove = useActionMutation(() => deleteRecord(recordId), {
    error: "기록을 삭제하지 못했어요",
    icon: Trash2Icon,
    invalidate: [recordsQueryOptions.queryKey, placesQueryOptions.queryKey],
    success: "기록을 삭제했어요",
    onSuccess: () => goBackTo("/records"),
  });

  return (
    <>
      <Button color="danger" fullWidth onClick={() => setOpen(true)} size="large" variant="weak">
        기록 삭제
      </Button>
      <ConfirmDialog
        cancelButton={
          <Button disabled={remove.isPending} onClick={() => setOpen(false)} variant="neutral">
            취소
          </Button>
        }
        confirmButton={
          <Button color="danger" loading={remove.isPending} onClick={() => remove.mutate()} variant="fill">
            기록 삭제
          </Button>
        }
        description="이 기록은 삭제한 뒤 되돌릴 수 없어요."
        onClose={() => setOpen(false)}
        open={open}
        title={`“${activity}” 기록을 삭제할까요?`}
      />
    </>
  );
}
