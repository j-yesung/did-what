"use client";

import type { ComponentProps, ReactNode } from "react";

import { NotePencilRoundedIcon } from "@/shared/assets/icons/note-pencil-rounded";
import { ICON_WEIGHT_MEDIUM } from "@/shared/lib/interaction";
import { cn } from "@/shared/lib/utils";
import { LiquidGlassButton, type LiquidGlassButtonProps } from "@/shared/ui/liquid-glass-button";
import { PressLink } from "@/shared/ui/press-link";

type RecordCreateButtonProps = {
  children?: ReactNode;
  className?: string;
  href?: string;
  onClick?: ComponentProps<typeof PressLink>["onClick"];
  surface?: LiquidGlassButtonProps["surface"];
};

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
      className={cn(ICON_WEIGHT_MEDIUM, className)}
      nativeButton={false}
      render={<PressLink href={href} onClick={onClick} prefetch />}
      shape={labeled ? "pill" : "circle"}
      surface={surface}
    >
      {children ?? <NotePencilRoundedIcon data-icon="inline-start" />}
    </LiquidGlassButton>
  );
}
