"use client";

import { useState } from "react";

import { Trash2Icon } from "@animateicons/react/lucide";
import { DotsThreeOutlineIcon } from "@phosphor-icons/react";

import { placesQueryOptions } from "@/entities/place";
import { RECORDS_QUERY_KEY } from "@/entities/record";
import { RECORD_COMMENTS_QUERY_KEY } from "@/entities/record-comment";
import { useGoBack } from "@/shared/lib/navigation/use-go-back";
import { useActionMutation } from "@/shared/lib/server-action/use-action-mutation";
import { Button } from "@/shared/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/shared/ui/drawer";
import { IconButton } from "@/shared/ui/icon-button";

import { deleteRecord } from "../api/delete-record";

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
    invalidate: [RECORDS_QUERY_KEY, RECORD_COMMENTS_QUERY_KEY, placesQueryOptions.queryKey],
    success: "기록을 삭제했어요",
    onSuccess: () => goBackTo("/records"),
  });

  return (
    <Drawer onOpenChange={setOpen} open={open} showSwipeHandle>
      <DrawerTrigger render={<IconButton aria-label="기록 더보기" icon={DotsThreeOutlineIcon} iconStrokeWidth={2} />} />
      <DrawerContent className="[--drawer-height:auto]">
        <DrawerHeader className="gap-2 px-5 pt-6 text-left group-data-[swipe-axis=y]/drawer-popup:text-left">
          <DrawerTitle className="font-bold text-xl leading-7">{`“${activity}” 기록을 삭제할까요?`}</DrawerTitle>
          <DrawerDescription className="text-base leading-6">
            이 기록과 댓글은 삭제한 뒤 되돌릴 수 없어요.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter className="mt-6 flex-row px-5 pb-5">
          <DrawerClose
            disabled={remove.isPending}
            render={<Button className="flex-1" color="dark" disabled={remove.isPending} size="large" variant="weak" />}
          >
            취소
          </DrawerClose>
          <Button
            className="flex-1"
            color="danger"
            loading={remove.isPending}
            onClick={() => remove.mutate()}
            size="large"
          >
            기록 삭제
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
