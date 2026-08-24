"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { runServerAction } from "@/shared/lib/server-action/run-server-action";
import { TextButton } from "@/shared/ui/text-button";

import { logout } from "../model/actions";

export function LogoutButton() {
  const queryClient = useQueryClient();

  const signOut = useMutation({
    mutationFn: () => runServerAction(logout),
    onSuccess: () => queryClient.clear(),
  });

  return (
    <TextButton className="w-full justify-center" tone="muted" size="lg" onClick={() => signOut.mutate()}>
      로그아웃
    </TextButton>
  );
}
