"use client";

import { CaretLeftIcon } from "@phosphor-icons/react";

import { useGoBack } from "@/shared/lib/navigation/use-go-back";

import { IconButton } from "../icon-button";

type Props = {
  fallbackHref?: string;
};

export function BackButton({ fallbackHref = "/" }: Props) {
  const goBackTo = useGoBack();

  return (
    <IconButton
      aria-label="이전 화면으로"
      icon={CaretLeftIcon}
      iconSize={28}
      iconWeight="bold"
      onClick={() => goBackTo(fallbackHref)}
    />
  );
}
