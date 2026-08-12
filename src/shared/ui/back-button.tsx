"use client";

import { ChevronLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "./button";

type BackButtonProps = {
  fallbackHref?: string;
};

export function BackButton({ fallbackHref = "/" }: BackButtonProps) {
  const router = useRouter();

  // history.length는 탭 전체 이력이라 정확하지 않다. 링크 공유나 PWA 바로가기로
  // 곧장 들어온 경우를 걸러내는 용도로만 쓴다.
  function goBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <Button aria-label="이전 화면으로" onClick={goBack} size="icon-lg" variant="ghost">
      <ChevronLeftIcon aria-hidden="true" />
    </Button>
  );
}
