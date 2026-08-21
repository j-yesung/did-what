"use client";

import { placesQueryOptions } from "@/entities/place/api/places-query";
import { recordsQueryOptions } from "@/entities/record/api/records-query";
import { useGoBack } from "@/shared/lib/navigation/use-go-back";
import { useActionMutation } from "@/shared/lib/server-action/use-action-mutation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
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
  const goBackTo = useGoBack();
  const remove = useActionMutation(() => deleteRecord(recordId), {
    error: "기록을 삭제하지 못했어요",
    invalidate: [recordsQueryOptions.queryKey, placesQueryOptions.queryKey],
    success: "기록을 삭제했어요",
    // 상세에서만 쓰인다. 삭제된 상세는 남겨둘 수 없으니 목록이든 타임라인이든 들어온 곳으로 돌아간다.
    onSuccess: () => goBackTo("/records"),
  });

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive" />}>삭제</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>“{activity}” 기록을 삭제할까요?</AlertDialogTitle>
          <AlertDialogDescription>
            함께한 사람과 연결된 기록도 사라지며, 삭제한 뒤에는 되돌릴 수 없어요.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={remove.isPending}>취소</AlertDialogCancel>
          <AlertDialogAction
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
