"use client";

import { useActionState } from "react";

import { CircleAlertIcon, Trash2Icon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
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
import { INITIAL_RECORD_ACTION_STATE } from "../model/record-form";

type DeleteRecordDialogProps = {
  activity: string;
  recordId: string;
};

export function DeleteRecordDialog({ activity, recordId }: DeleteRecordDialogProps) {
  const [state, formAction, pending] = useActionState(deleteRecord.bind(null, recordId), INITIAL_RECORD_ACTION_STATE);

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
        {state.message ? (
          <Alert variant="destructive">
            <CircleAlertIcon aria-hidden="true" />
            <AlertTitle>기록을 삭제하지 못했어요</AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>취소</AlertDialogCancel>
          <form action={formAction}>
            <AlertDialogAction className="w-full" loading={pending} type="submit" variant="destructive">
              기록 삭제
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
