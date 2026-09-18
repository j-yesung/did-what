"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";

import { FOCUS_RING } from "@/shared/lib/interaction";
import { cn } from "@/shared/lib/utils";

export type LiquidGlassButtonProps = ButtonPrimitive.Props & {
  shape?: "pill" | "circle";
  surface?: "glass" | "group";
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
        "inline-flex touch-manipulation select-none items-center justify-center rounded-full font-semibold text-base transition-transform duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] [-webkit-tap-highlight-color:transparent] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 motion-reduce:transition-none motion-reduce:active:scale-100 [&_svg]:size-5 [&_svg]:shrink-0",
        shape === "circle"
          ? "size-[54px] min-w-0 p-0 text-foreground [&_svg]:size-6"
          : "h-[54px] min-w-[148px] px-6 text-light",
        surface === "glass"
          ? "liquid-glass-control"
          : "bg-transparent text-foreground shadow-none [-webkit-backdrop-filter:none] [backdrop-filter:none] active:scale-100",
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
