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
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";

import { deletePlace } from "../model/actions";

type DeletePlaceDialogProps = {
  iconOnly?: boolean;
  name: string;
  placeId: string;
  recordCount: number;
};

export function DeletePlaceDialog({ iconOnly, name, placeId, recordCount }: DeletePlaceDialogProps) {
  const remove = useActionMutation(() => deletePlace(placeId), {
    error: "장소를 삭제하지 못했어요",
    success: "장소를 삭제했어요",
  });

  return (
    <AlertDialog>
      {iconOnly ? (
        <AlertDialogTrigger
          aria-label={`${name} 삭제`}
          render={<Button className="size-11 text-destructive [&_svg]:size-4.5" size="icon-lg" variant="ghost" />}
        >
          <Trash2Icon aria-hidden="true" />
        </AlertDialogTrigger>
      ) : (
        <AlertDialogTrigger render={<Button className="w-full" variant="destructive" />}>장소 삭제</AlertDialogTrigger>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{name}을(를) 삭제할까요?</AlertDialogTitle>
          <AlertDialogDescription>
            {recordCount > 0
              ? `이곳의 기록 ${recordCount}개에서 방문 장소만 빠지고 기록 자체는 남아요.\n되돌릴 수 없어요.`
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
            장소 삭제
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
