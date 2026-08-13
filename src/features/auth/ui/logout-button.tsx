"use client";

import { useFormStatus } from "react-dom";

import { LogOutIcon } from "lucide-react";

import { Button } from "@/shared/ui/button";

import { logout } from "../model/actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full" loading={pending} type="submit" variant="outline">
      <LogOutIcon data-icon="inline-start" />
      로그아웃
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
