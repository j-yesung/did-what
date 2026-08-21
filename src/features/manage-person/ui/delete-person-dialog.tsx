"use client";

import { peopleQueryOptions } from "@/entities/person/api/people-query";
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

import { deletePerson } from "../model/actions";

type DeletePersonDialogProps = {
  name: string;
  personId: string;
  recordCount: number;
};

export function DeletePersonDialog({ name, personId, recordCount }: DeletePersonDialogProps) {
  const goBackTo = useGoBack();
  const remove = useActionMutation(() => deletePerson(personId), {
    error: "사람을 삭제하지 못했어요",
    invalidate: [peopleQueryOptions.queryKey, recordsQueryOptions.queryKey],
    success: "사람을 삭제했어요",
    onSuccess: () => goBackTo("/people"),
  });

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button className="flex-1" variant="destructive" />}>삭제</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{name}님을 삭제할까요?</AlertDialogTitle>
          <AlertDialogDescription>
            {recordCount > 0
              ? `함께한 기록 ${recordCount}개에서 ${name}님만 빠지고 기록 자체는 남아요.\n되돌릴 수 없어요.`
              : "삭제한 뒤에는 되돌릴 수 없어요."}
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
            삭제
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
