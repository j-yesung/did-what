"use client";

import { CaretLeftIcon } from "@phosphor-icons/react";

import { useGoBack } from "@/shared/lib/navigation/use-go-back";

import { IconButton } from "../icon-button";

type BackButtonProps = {
  fallbackHref?: string;
};

/** 작성 중인 폼의 이탈 확인은 여기서 하지 않는다. 폼이 세운 LeaveGuard가 뒤로가기를 가로채 묻는다. */
export function BackButton({ fallbackHref = "/" }: BackButtonProps) {
  const goBackTo = useGoBack();

  return (
    <IconButton
      aria-label="이전 화면으로"
      icon={CaretLeftIcon}
      iconStrokeWidth={2}
      onClick={() => goBackTo(fallbackHref)}
    />
  );
}
