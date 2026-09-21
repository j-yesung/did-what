"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";

import { FOCUS_RING } from "@/shared/lib/interaction";
import { cn } from "@/shared/lib/utils";

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
  return (
    <ButtonPrimitive
      className={cn(
        "inline-flex touch-manipulation select-none items-center justify-center rounded-full font-semibold text-base [-webkit-tap-highlight-color:transparent] disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-5 [&_svg]:shrink-0",
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
}
