"use client";

import { CaretLeftIcon } from "@phosphor-icons/react";

import { useGoBack } from "@/shared/lib/navigation/use-go-back";

import { Button } from "../button";

type BackButtonProps = {
  fallbackHref?: string;
};

/** 작성 중인 폼의 이탈 확인은 여기서 하지 않는다. 폼이 세운 LeaveGuard가 뒤로가기를 가로채 묻는다. */
export function BackButton({ fallbackHref = "/" }: BackButtonProps) {
  const goBackTo = useGoBack();

  return (
    <Button
      aria-label="이전 화면으로"
      className="size-11"
      onClick={() => goBackTo(fallbackHref)}
      size="icon-lg"
      variant="ghost"
    >
      <CaretLeftIcon strokeWidth={2} aria-hidden="true" />
    </Button>
  );
}
