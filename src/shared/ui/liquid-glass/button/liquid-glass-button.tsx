"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { Button as GlisseButton } from "glisse";

import { FOCUS_RING, ICON_WEIGHT_MEDIUM } from "@/shared/lib/interaction";
import { cn } from "@/shared/lib/utils";

import "./liquid-glass-button.css";

export type LiquidGlassButtonProps = ButtonPrimitive.Props & {
  shape?: "pill" | "circle";
  surface?: "glass" | "group";
};

export function LiquidGlassButton({
  children,
  className,
  shape = "pill",
  surface = "glass",
  style,
  type = "button",
  ...props
}: LiquidGlassButtonProps) {
  const buttonProps = {
    ...props,
    style: typeof style === "function" ? style({ disabled: Boolean(props.disabled) }) : style,
    className: cn(
      "inline-flex cursor-pointer touch-none select-none items-center justify-center rounded-full font-semibold text-base [-webkit-tap-highlight-color:transparent] disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-5 [&_svg]:shrink-0",
      shape === "circle"
        ? cn("size-(--toolbar-height) min-w-0 p-0 text-foreground [&_svg]:size-6", ICON_WEIGHT_MEDIUM)
        : "h-(--toolbar-height) min-w-37 px-6 text-foreground",
      FOCUS_RING,
      typeof className === "function" ? className({ disabled: Boolean(props.disabled) }) : className,
    ),
    "data-slot": "liquid-glass-button",
    type,
    children: (
      <span className="pointer-events-none inline-flex items-center justify-center gap-2" data-layer="content">
        {children}
      </span>
    ),
  };

  if (surface === "group") return <ButtonPrimitive {...buttonProps} />;
  return <GlisseButton as={ButtonPrimitive} {...buttonProps} />;
}
