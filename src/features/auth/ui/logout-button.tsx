"use client";

import { useFormStatus } from "react-dom";

import { LogOutIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import { logout } from "../model/actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full" variant="outline" type="submit" disabled={pending}>
      {pending ? (
        <Spinner data-icon="inline-start" aria-label="로그아웃 중" />
      ) : (
        <LogOutIcon data-icon="inline-start" />
      )}
      {pending ? "로그아웃 중..." : "로그아웃"}
    </Button>
  );
}

export function LogoutButton() {
  return (
    <form action={logout} className="w-full">
      <SubmitButton />
    </form>
  );
}
