"use client";

import { useMutation } from "@tanstack/react-query";

import { runServerAction } from "@/shared/lib/server-action/run-server-action";
import { Button } from "@/shared/ui/button";

import { logout } from "../model/actions";

export function LogoutButton() {
  /** 성공하면 로그인 화면으로 넘어가므로 알릴 결과가 없다. 누른 동안 두 번 눌리지만 않게 한다. */
  const signOut = useMutation({ mutationFn: () => runServerAction(logout) });

  return (
    <Button
      className="w-full"
      loading={signOut.isPending}
      onClick={() => signOut.mutate()}
      type="button"
      variant="outline"
    >
      로그아웃
    </Button>
  );
}
