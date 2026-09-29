import type { ComponentProps } from "react";

import type { Icon, IconWeight } from "@phosphor-icons/react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

type IconButtonVariant = "fill" | "clear" | "border";
type IconButtonSize = "sm" | "default" | "lg";

const ICON_BUTTON_VARIANT: Record<IconButtonVariant, string> = {
  border: "border-border bg-transparent text-muted-foreground active:bg-muted",
  clear: "bg-transparent text-muted-foreground active:bg-muted",
  fill: "bg-primary text-primary-foreground active:bg-primary",
};

const ICON_BUTTON_SIZE: Record<IconButtonSize, string> = {
  // 28px는 보이는 크기만 작게 두고, 누를 수 있는 범위는 보이지 않는 영역으로 44px까지 넓힌다.
  sm: "size-7 before:absolute before:-inset-2 before:content-['']",
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
  iconWeight?: IconWeight;
  size?: IconButtonSize;
  variant?: IconButtonVariant;
};

function IconButton({
  "aria-label": ariaLabel,
  className,
  icon: Icon,
  iconSize,
  iconWeight,
  size = "default",
  variant = "clear",
  ...props
}: IconButtonProps) {
  const resolvedIconSize = iconSize ?? ICON_SIZE[size];

  return (
    <Button
      aria-label={ariaLabel}
      className={cn("min-w-0 gap-0 rounded-lg p-0", ICON_BUTTON_SIZE[size], ICON_BUTTON_VARIANT[variant], className)}
      data-slot="icon-button"
      data-variant={variant}
      variant="ghost"
      {...props}
    >
      <Icon
        aria-hidden="true"
        size={resolvedIconSize}
        style={{ height: resolvedIconSize, width: resolvedIconSize }}
        weight={iconWeight}
      />
    </Button>
  );
}

export { IconButton, type IconButtonProps, type IconButtonSize, type IconButtonVariant };
