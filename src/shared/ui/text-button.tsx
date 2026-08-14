import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { ChevronRightIcon } from "lucide-react";

import { FOCUS_RING, PRESS_FEEDBACK } from "#shared/lib/interaction.ts";
import { cn } from "#shared/lib/utils.ts";

const textButtonVariants = cva(
  cn(
    "inline-flex shrink-0 touch-manipulation select-none items-center gap-0.5 rounded-md font-medium after:-inset-x-2 after:-inset-y-1 disabled:pointer-events-none disabled:opacity-40",
    FOCUS_RING,
    PRESS_FEEDBACK,
  ),
  {
    variants: {
      variant: {
        clear: "",
        arrow: "",
        underline: "underline underline-offset-4",
      },
      size: {
        sm: "text-xs [&_svg]:size-3.5",
        default: "text-sm [&_svg]:size-4",
        lg: "text-base [&_svg]:size-[18px]",
      },
      tone: {
        default: "text-foreground",
        muted: "text-muted-foreground",
        brand: "text-primary",
        danger: "text-destructive",
      },
    },
    defaultVariants: {
      size: "default",
      tone: "default",
      variant: "clear",
    },
  },
);

type TextButtonProps = ButtonPrimitive.Props & VariantProps<typeof textButtonVariants>;

function TextButton({ children, className, size, tone, variant = "clear", ...props }: TextButtonProps) {
  return (
    <ButtonPrimitive
      className={cn(textButtonVariants({ className, size, tone, variant }))}
      data-slot="text-button"
      {...props}
    >
      {children}
      {variant === "arrow" ? <ChevronRightIcon aria-hidden="true" /> : null}
    </ButtonPrimitive>
  );
}

export { TextButton, textButtonVariants };
