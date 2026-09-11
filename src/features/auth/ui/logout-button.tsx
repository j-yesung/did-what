"use client";

import { useState } from "react";

import { SignOutIcon } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { runServerAction } from "@/shared/lib/server-action/run-server-action";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog, ConfirmDialogCancelButton } from "@/shared/ui/confirm-dialog";

import { logout } from "../api/auth-actions";

export function LogoutButton() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const signOut = useMutation({
    mutationFn: () => runServerAction(logout),
    onSuccess: () => queryClient.clear(),
  });

  return (
    <>
      <Button
        className="mt-auto w-full justify-center"
        color="danger"
        variant="weak"
        size="large"
        onClick={() => setOpen(true)}
      >
        <SignOutIcon aria-hidden="true" data-icon="inline-start" strokeWidth={2} />
        로그아웃
      </Button>
      <ConfirmDialog
        cancelButton={
          <ConfirmDialogCancelButton disabled={signOut.isPending} onClick={() => setOpen(false)}>
            취소
          </ConfirmDialogCancelButton>
        }
        confirmButton={
          <Button color="danger" variant="fill" loading={signOut.isPending} onClick={() => signOut.mutate()}>
            로그아웃
          </Button>
        }
        description="로그아웃하면 다시 로그인해야 해요."
        onClose={() => setOpen(false)}
        open={open}
        title="로그아웃할까요?"
      />
    </>
  );
}
