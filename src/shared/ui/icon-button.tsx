import type { ComponentProps } from "react";

import type { Icon, IconWeight } from "@phosphor-icons/react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

type IconButtonVariant = "fill" | "clear" | "border";
type IconButtonSize = "sm" | "default" | "lg";

const ICON_BUTTON_VARIANT: Record<IconButtonVariant, string> = {
  border: "border-border bg-transparent text-muted-foreground active:bg-muted",
  clear: "bg-transparent text-muted-foreground active:bg-muted",
  fill: "bg-muted text-muted-foreground active:bg-transparent",
};

const ICON_BUTTON_SIZE: Record<IconButtonSize, string> = {
  sm: "size-7",
  default: "size-11",
  lg: "size-12",
};

const ICON_SIZE: Record<IconButtonSize, number> = {
  sm: 18,
  default: 24,
  lg: 24,
};

type IconButtonProps = Omit<ComponentProps<typeof Button>, "aria-label" | "children" | "size" | "variant"> & {
  "aria-label": string;
  icon: Icon;
  iconSize?: number;
  iconStrokeWidth?: number;
  iconWeight?: IconWeight;
  size?: IconButtonSize;
  variant?: IconButtonVariant;
};

function IconButton({
  "aria-label": ariaLabel,
  className,
  icon: Icon,
  iconSize,
  iconStrokeWidth,
  iconWeight,
  size = "default",
  variant = "clear",
  ...props
}: IconButtonProps) {
  return (
    <Button
      aria-label={ariaLabel}
      className={cn("gap-0 rounded-lg p-0", ICON_BUTTON_SIZE[size], ICON_BUTTON_VARIANT[variant], className)}
      data-slot="icon-button"
      data-size={size}
      data-variant={variant}
      variant="ghost"
      {...props}
    >
      <Icon aria-hidden="true" size={iconSize ?? ICON_SIZE[size]} strokeWidth={iconStrokeWidth} weight={iconWeight} />
    </Button>
  );
}

export { IconButton, type IconButtonProps, type IconButtonSize, type IconButtonVariant };
