"use client";

import { useActionState } from "react";

import { Trash2Icon } from "lucide-react";

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
import { useActionToast } from "@/shared/ui/toast";

import { deletePlace } from "../model/actions";
import { INITIAL_PLACE_ACTION_STATE } from "../model/place-form";

type DeletePlaceDialogProps = {
  iconOnly?: boolean;
  name: string;
  placeId: string;
  recordCount: number;
};

export function DeletePlaceDialog({ iconOnly, name, placeId, recordCount }: DeletePlaceDialogProps) {
  const [state, formAction, pending] = useActionState(deletePlace.bind(null, placeId), INITIAL_PLACE_ACTION_STATE);
  useActionToast(state, { error: "장소를 삭제하지 못했어요" });

  return (
    <AlertDialog>
      {iconOnly ? (
        <AlertDialogTrigger
          aria-label={`${name} 삭제`}
          render={<Button className="size-11 text-destructive [&_svg]:size-[18px]" size="icon-lg" variant="ghost" />}
        >
          <Trash2Icon aria-hidden="true" />
        </AlertDialogTrigger>
      ) : (
        <AlertDialogTrigger render={<Button className="w-full" variant="destructive" />}>
          <Trash2Icon data-icon="inline-start" />
          장소 삭제
        </AlertDialogTrigger>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <Trash2Icon aria-hidden="true" />
          </AlertDialogMedia>
          <AlertDialogTitle>{name}을(를) 삭제할까요?</AlertDialogTitle>
          <AlertDialogDescription>
            {recordCount > 0
              ? `이곳의 기록 ${recordCount}개에서 방문 장소만 빠지고 기록 자체는 남아요.\n되돌릴 수 없어요.`
              : "삭제한 뒤에는 되돌릴 수 없어요."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>취소</AlertDialogCancel>
          <form action={formAction}>
            <AlertDialogAction className="w-full" loading={pending} type="submit" variant="destructive">
              장소 삭제
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
