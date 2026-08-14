"use client";

import { Trash2Icon } from "lucide-react";

import { useActionMutation } from "@/shared/lib/server-action/use-action-mutation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";

import { deleteRecord } from "../model/actions";

type DeleteRecordDialogProps = {
  activity: string;
  recordId: string;
};

export function DeleteRecordDialog({ activity, recordId }: DeleteRecordDialogProps) {
  const remove = useActionMutation(() => deleteRecord(recordId), {
    error: "기록을 삭제하지 못했어요",
    success: "기록을 삭제했어요",
  });

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        <Trash2Icon data-icon="inline-start" />
        삭제
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <Trash2Icon aria-hidden="true" />
          </AlertDialogMedia>
          <AlertDialogTitle>“{activity}” 기록을 삭제할까요?</AlertDialogTitle>
          <AlertDialogDescription>
            함께한 사람과 연결된 기록도 사라지며, 삭제한 뒤에는 되돌릴 수 없어요.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={remove.isPending}>취소</AlertDialogCancel>
          <AlertDialogAction
            className="w-full"
            loading={remove.isPending}
            onClick={() => remove.mutate()}
            type="button"
            variant="destructive"
          >
            기록 삭제
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
