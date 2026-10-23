import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { FOCUS_RING, PRESS_FEEDBACK } from "@/shared/lib/interaction";
import { cn } from "@/shared/lib/utils";

const textButtonVariants = cva(
  cn(
    "inline-flex shrink-0 touch-manipulation select-none items-center gap-0.5 rounded-md font-medium after:-inset-x-2 after:-inset-y-1 disabled:pointer-events-none disabled:opacity-40",
    FOCUS_RING,
    PRESS_FEEDBACK,
  ),
  {
    variants: {
      size: {
        sm: "text-xs [&_svg]:size-3.5",
        default: "text-sm [&_svg]:size-4",
      },
      tone: {
        default: "text-foreground",
        muted: "text-muted-foreground",
        brand: "text-accent-text",
      },
    },
    defaultVariants: {
      size: "default",
      tone: "default",
    },
  },
);

type TextButtonProps = ButtonPrimitive.Props & VariantProps<typeof textButtonVariants>;

function TextButton({ className, size, tone, ...props }: TextButtonProps) {
  return (
    <ButtonPrimitive className={cn(textButtonVariants({ className, size, tone }))} data-slot="text-button" {...props} />
  );
}

export { TextButton, textButtonVariants };
