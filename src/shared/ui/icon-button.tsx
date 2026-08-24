import type { ComponentProps } from "react";

import type { Icon } from "@phosphor-icons/react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

type IconButtonVariant = "fill" | "clear" | "border";

const ICON_BUTTON_VARIANT: Record<IconButtonVariant, string> = {
  border: "border-border bg-transparent text-muted-foreground active:bg-muted",
  clear: "bg-transparent text-muted-foreground active:bg-muted",
  fill: "bg-muted text-muted-foreground active:bg-transparent",
};

type IconButtonProps = Omit<ComponentProps<typeof Button>, "aria-label" | "children" | "size" | "variant"> & {
  "aria-label": string;
  icon: Icon;
  iconSize?: number;
  variant?: IconButtonVariant;
};

function IconButton({ className, icon: Icon, iconSize = 24, variant = "clear", ...props }: IconButtonProps) {
  return (
    <Button
      className={cn("size-12 rounded-full", ICON_BUTTON_VARIANT[variant], className)}
      data-slot="icon-button"
      data-variant={variant}
      size="icon-lg"
      variant="ghost"
      {...props}
    >
      <Icon aria-hidden="true" size={iconSize} />
    </Button>
  );
}

export { IconButton, type IconButtonProps, type IconButtonVariant };
