"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";

import { FOCUS_RING } from "@/shared/lib/interaction";
import { cn } from "@/shared/lib/utils";
import { PressScale } from "@/shared/ui/press-scale";

export type LiquidGlassButtonProps = ButtonPrimitive.Props & {
  shape?: "pill" | "circle";
  surface?: "glass" | "group";
};

const SURFACE_CLASS: Record<NonNullable<LiquidGlassButtonProps["surface"]>, string> = {
  glass: "liquid-glass-control",
  group: "text-foreground",
};

export function LiquidGlassButton({
  children,
  className,
  shape = "pill",
  surface = "glass",
  type = "button",
  ...props
}: LiquidGlassButtonProps) {
  const button = (
    <ButtonPrimitive
      className={cn(
        "inline-flex cursor-pointer touch-manipulation select-none items-center justify-center rounded-full font-semibold text-base [-webkit-tap-highlight-color:transparent] disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-5 [&_svg]:shrink-0",
        shape === "circle"
          ? "size-(--toolbar-height) min-w-0 p-0 text-foreground [&_svg]:size-6"
          : "h-(--toolbar-height) min-w-37 px-6 text-light",
        SURFACE_CLASS[surface],
        FOCUS_RING,
        className,
      )}
      data-slot="liquid-glass-button"
      type={type}
      {...props}
    >
      <span className="pointer-events-none inline-flex items-center justify-center gap-2" data-layer="content">
        {children}
      </span>
    </ButtonPrimitive>
  );

  /**
   * 버튼 한 개로 쓸 때만 누름 효과로 감싼다. group은 묶음 전체가 이미 함께 커져서 여기서 또 감싸면 두 번 커진다.
   * 비활성 버튼은 누름을 통과시켜 감싼 층이 대신 받으므로, 비활성일 때는 감싼 층도 누름을 받지 않게 한다.
   */
  if (surface === "group") return button;
  return <PressScale className="pointer-events-auto inline-flex has-disabled:pointer-events-none">{button}</PressScale>;
}
