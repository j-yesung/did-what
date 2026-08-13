"use client";

import { useState } from "react";

import { ChevronLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../alert-dialog";
import { Button } from "../button";

type BackButtonProps = {
  fallbackHref?: string;
  guardFormId?: string;
};

export function BackButton({ fallbackHref = "/", guardFormId }: BackButtonProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function navigateBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  function goBack() {
    if (guardFormId && document.getElementById(guardFormId)?.dataset.dirty === "true") {
      setConfirmOpen(true);
      return;
    }

    navigateBack();
  }

  return (
    <>
      <Button aria-label="이전 화면으로" className="size-11" onClick={goBack} size="icon-lg" variant="ghost">
        <ChevronLeftIcon aria-hidden="true" />
      </Button>

      {guardFormId ? (
        <AlertDialog onOpenChange={setConfirmOpen} open={confirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>작성 중인 내용이 사라져요</AlertDialogTitle>
              <AlertDialogDescription>이 화면을 나가면 입력한 내용이 저장되지 않아요.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>계속 작성</AlertDialogCancel>
              <AlertDialogAction onClick={navigateBack} variant="destructive">
                나가기
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </>
  );
}
