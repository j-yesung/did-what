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
        "group relative isolate inline-flex touch-manipulation select-none items-center justify-center overflow-hidden rounded-full font-semibold text-base transition-transform duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] [-webkit-tap-highlight-color:transparent] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 motion-reduce:transition-none motion-reduce:active:scale-100 [&_svg]:size-5 [&_svg]:shrink-0",
        shape === "circle"
          ? "size-[54px] min-w-0 p-0 text-foreground [&_svg]:size-6"
          : "h-[54px] min-w-[148px] px-6 text-light",
        surface === "glass"
          ? "bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-light)_8%,transparent)_0%,color-mix(in_oklab,var(--color-light)_6%,transparent)_45%,color-mix(in_oklab,var(--color-light)_5%,transparent)_100%)] shadow-[inset_0_-1px_1px_color-mix(in_oklab,var(--color-dark)_6%,transparent),0_6px_18px_color-mix(in_oklab,var(--color-dark)_8%,transparent)] [-webkit-backdrop-filter:blur(5px)_saturate(115%)] [backdrop-filter:blur(5px)_saturate(115%)]"
          : "bg-transparent text-foreground shadow-none [-webkit-backdrop-filter:none] [backdrop-filter:none] active:scale-100",
        FOCUS_RING,
        className,
      )}
      data-slot="liquid-glass-button"
      type={type}
      {...props}
    >
      {surface === "glass" ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-45 transition-[transform,opacity] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] [background:radial-gradient(ellipse_at_28%_8%,color-mix(in_oklab,var(--color-light)_12%,transparent),transparent_58%),radial-gradient(ellipse_at_72%_92%,color-mix(in_oklab,var(--color-dark)_6%,transparent),transparent_62%)] [transform:scale(1.08)] group-active:opacity-60 motion-reduce:transform-none motion-reduce:transition-none group-active:[transform:translateY(1px)_scale(1.15,0.92)]"
          data-layer="refraction"
        />
      ) : null}
      <span className="pointer-events-none relative inline-flex items-center justify-center gap-2" data-layer="content">
        {children}
      </span>
    </ButtonPrimitive>
  );
}
