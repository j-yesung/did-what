"use client";

import type { ReactNode } from "react";

import { NotePencilIcon } from "@phosphor-icons/react";

import { LiquidGlassButton } from "@/shared/ui/liquid-glass-button";
import { PressLink } from "@/shared/ui/press-link";

type RecordCreateButtonProps = {
  children?: ReactNode;
  href?: string;
};

export function RecordCreateButton({ children, href = "/records/new" }: RecordCreateButtonProps) {
  const labeled = children !== undefined;

  return (
    <LiquidGlassButton
      aria-label={labeled ? undefined : "기록 남기기"}
      className={labeled ? undefined : "size-11"}
      nativeButton={false}
      render={<PressLink href={href} prefetch />}
      shape={labeled ? "pill" : "circle"}
      surface={labeled ? "glass" : "group"}
    >
      {children ?? <NotePencilIcon data-icon="inline-start" />}
    </LiquidGlassButton>
  );
}
