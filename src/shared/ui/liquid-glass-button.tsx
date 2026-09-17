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
        "group relative isolate inline-flex touch-manipulation select-none items-center justify-center overflow-hidden rounded-full border font-semibold text-base transition-transform duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] [-webkit-tap-highlight-color:transparent] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 motion-reduce:transition-none motion-reduce:active:scale-100 [&_svg]:size-5 [&_svg]:shrink-0",
        shape === "circle"
          ? "size-[54px] min-w-0 border-foreground/20 p-0 text-foreground [&_svg]:size-6"
          : "h-[54px] min-w-[148px] border-light/35 px-6 text-light",
        surface === "glass"
          ? "bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-light)_18%,transparent)_0%,color-mix(in_oklab,var(--color-light)_8.5%,transparent)_45%,color-mix(in_oklab,var(--color-light)_6%,transparent)_100%)] shadow-[inset_0_1px_0_color-mix(in_oklab,var(--color-light)_65%,transparent),inset_0_-1px_1px_color-mix(in_oklab,var(--color-dark)_10%,transparent),0_8px_24px_color-mix(in_oklab,var(--color-dark)_14%,transparent)] [-webkit-backdrop-filter:blur(5px)_saturate(145%)_brightness(1.08)] [backdrop-filter:blur(5px)_saturate(145%)_brightness(1.08)]"
          : "border-transparent bg-transparent text-foreground shadow-none [-webkit-backdrop-filter:none] [backdrop-filter:none] active:scale-100",
        FOCUS_RING,
        className,
      )}
      data-slot="liquid-glass-button"
      type={type}
      {...props}
    >
      {surface === "glass" ? (
        <>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-80 transition-[transform,opacity] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] [background:radial-gradient(ellipse_at_28%_8%,color-mix(in_oklab,var(--color-light)_32%,transparent),transparent_58%),radial-gradient(ellipse_at_72%_92%,color-mix(in_oklab,var(--color-dark)_10%,transparent),transparent_62%)] [filter:saturate(1.25)_contrast(1.05)] [transform:scale(1.08)] group-active:opacity-95 motion-reduce:transform-none motion-reduce:transition-none group-active:[transform:translateY(1px)_scale(1.15,0.92)]"
            data-layer="refraction"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-55 mix-blend-screen transition-[transform,opacity] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] [background:radial-gradient(ellipse_at_18%_16%,color-mix(in_oklab,var(--color-light)_32%,transparent),transparent_45%),linear-gradient(115deg,transparent_28%,color-mix(in_oklab,var(--color-light)_14%,transparent)_48%,transparent_64%)] group-active:opacity-75 motion-reduce:transform-none motion-reduce:transition-none group-active:[transform:translateY(1px)_scaleX(1.08)]"
            data-layer="caustic"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-px rounded-[inherit] shadow-[inset_0_1px_0_color-mix(in_oklab,var(--color-light)_74%,transparent)] [background:linear-gradient(180deg,color-mix(in_oklab,var(--color-light)_22%,transparent),transparent_44%)]"
            data-layer="highlight"
          />
        </>
      ) : null}
      <span
        className="pointer-events-none relative inline-flex items-center justify-center gap-2 drop-shadow-[0_1px_1px_color-mix(in_oklab,var(--color-dark)_28%,transparent)]"
        data-layer="content"
      >
        {children}
      </span>
    </ButtonPrimitive>
  );
}
