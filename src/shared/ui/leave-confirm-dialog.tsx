"use client";

import { Button } from "./button";
import { ConfirmDialog, ConfirmDialogCancelButton } from "./confirm-dialog";

/** 작성 중인 폼을 떠나기 전에 묻는다. 이탈 판단은 useLeaveGuard가 한다. */
export function LeaveConfirmDialog({
  onLeave,
  onStay,
  open,
}: {
  onLeave: () => void;
  onStay: () => void;
  open: boolean;
}) {
  return (
    <ConfirmDialog
      cancelButton={<ConfirmDialogCancelButton onClick={onStay}>계속 작성</ConfirmDialogCancelButton>}
      confirmButton={
        <Button color="danger" onClick={onLeave} variant="fill">
          나가기
        </Button>
      }
      description="이 화면을 나가면 입력한 내용이 저장되지 않아요."
      onClose={onStay}
      open={open}
      title="작성 중인 내용이 사라져요"
    />
  );
}
