"use client";

import type { ComponentProps, ReactNode } from "react";

import { NotePencilIcon } from "@phosphor-icons/react";

import { LiquidGlassButton, type LiquidGlassButtonProps } from "@/shared/ui/liquid-glass-button";
import { PressLink } from "@/shared/ui/press-link";

type RecordCreateButtonProps = {
  children?: ReactNode;
  className?: string;
  href?: string;
  onClick?: ComponentProps<typeof PressLink>["onClick"];
  surface?: LiquidGlassButtonProps["surface"];
};

/** 글자 유무는 모양만 정한다. 바탕과 크기는 놓이는 자리가 정하므로 부르는 쪽이 넘긴다. */
export function RecordCreateButton({
  children,
  className,
  href = "/records/new",
  onClick,
  surface = "glass",
}: RecordCreateButtonProps) {
  const labeled = children !== undefined;

  return (
    <LiquidGlassButton
      aria-label={labeled ? undefined : "기록 남기기"}
      className={className}
      nativeButton={false}
      render={<PressLink href={href} onClick={onClick} prefetch />}
      shape={labeled ? "pill" : "circle"}
      surface={surface}
    >
      {children ?? <NotePencilIcon data-icon="inline-start" />}
    </LiquidGlassButton>
  );
}
