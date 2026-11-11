"use client";

import type { ComponentProps } from "react";

import Link from "next/link";

import { usePressNavigate } from "@/shared/lib/navigation/use-press-navigate";

type PressLinkProps = Omit<ComponentProps<typeof Link>, "onClick"> & {
  onClick?: ComponentProps<typeof Link>["onClick"];
  onPressNavigate?: (href: string) => void;
};

/** 앱 내부 링크가 iOS 뒤로가기 스냅샷에 눌린 채 남지 않도록 이동을 공통 처리한다. */
export function PressLink({ onClick, onPressNavigate, ...props }: PressLinkProps) {
  const pressNavigate = usePressNavigate(onPressNavigate);

  return (
    <Link
      {...props}
      onClick={(event) => {
        onClick?.(event);
        pressNavigate(event);
      }}
    />
  );
}
