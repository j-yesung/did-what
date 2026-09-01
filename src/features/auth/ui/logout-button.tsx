"use client";

import { useState } from "react";

import { SignOutIcon } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { runServerAction } from "@/shared/lib/server-action/run-server-action";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { TextButton } from "@/shared/ui/text-button";

import { logout } from "../model/actions";

export function LogoutButton() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const signOut = useMutation({
    mutationFn: () => runServerAction(logout),
    onSuccess: () => queryClient.clear(),
  });

  return (
    <>
      <TextButton className="mt-auto w-full justify-center" tone="muted" size="lg" onClick={() => setOpen(true)}>
        <SignOutIcon aria-hidden="true" data-icon="inline-start" strokeWidth={2} />
        로그아웃
      </TextButton>
      <ConfirmDialog
        cancelButton={
          <Button disabled={signOut.isPending} onClick={() => setOpen(false)} variant="neutral">
            취소
          </Button>
        }
        confirmButton={
          <Button color="danger" loading={signOut.isPending} onClick={() => signOut.mutate()} variant="fill">
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
