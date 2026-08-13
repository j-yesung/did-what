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
import { Spinner } from "@/shared/ui/spinner";

import { deletePerson } from "../model/actions";
import { INITIAL_PERSON_ACTION_STATE } from "../model/person-form";

type DeletePersonDialogProps = {
  name: string;
  personId: string;
  recordCount: number;
};

export function DeletePersonDialog({ name, personId, recordCount }: DeletePersonDialogProps) {
  const [state, formAction, pending] = useActionState(deletePerson.bind(null, personId), INITIAL_PERSON_ACTION_STATE);

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button className="flex-1" variant="destructive" />}>
        <Trash2Icon data-icon="inline-start" />
        삭제
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <Trash2Icon aria-hidden="true" />
          </AlertDialogMedia>
          <AlertDialogTitle>{name}님을 삭제할까요?</AlertDialogTitle>
          <AlertDialogDescription>
            {recordCount > 0
              ? `함께한 기록 ${recordCount}개에서 ${name}님만 빠지고 기록 자체는 남아요. 되돌릴 수 없어요.`
              : "삭제한 뒤에는 되돌릴 수 없어요."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {state.message ? (
          <Alert variant="destructive">
            <CircleAlertIcon aria-hidden="true" />
            <AlertTitle>사람을 삭제하지 못했어요</AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>취소</AlertDialogCancel>
          <form action={formAction}>
            <AlertDialogAction className="w-full" disabled={pending} type="submit" variant="destructive">
              {pending ? <Spinner data-icon="inline-start" aria-label="사람 삭제 중" /> : null}
              {pending ? "삭제 중..." : "사람 삭제"}
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
