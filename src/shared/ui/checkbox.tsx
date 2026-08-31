"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { CheckIcon } from "@phosphor-icons/react";

import { cn } from "@/shared/lib/utils";

type CheckboxVariant = "check" | "circle" | "square";

const CHECKBOX_VARIANT: Record<CheckboxVariant, string> = {
  check:
    "border-0! bg-transparent! text-foreground! data-checked:border-transparent! data-checked:bg-transparent! data-checked:text-foreground! dark:bg-transparent! dark:data-checked:bg-transparent!",
  circle: "rounded-full",
  square: "rounded-[4px]",
};

type CheckboxProps = CheckboxPrimitive.Root.Props & {
  variant?: CheckboxVariant;
};

function Checkbox({ className, variant = "square", ...props }: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative flex size-4 shrink-0 items-center justify-center border border-input outline-none transition-colors after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 group-has-disabled/field:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-primary data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground dark:bg-input/30 dark:data-checked:bg-primary dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        CHECKBOX_VARIANT[variant],
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-[opacity,transform] duration-200 ease-out data-ending-style:scale-75 data-ending-style:opacity-0 motion-reduce:transition-none motion-reduce:data-ending-style:scale-100 motion-reduce:data-ending-style:opacity-100 [&>span>svg]:size-3.5 [&>span]:inline-flex"
      >
        <span className="motion-safe:fade-in-0 motion-safe:zoom-in-50 motion-safe:slide-in-from-bottom-1 inline-flex motion-safe:animate-in motion-safe:fill-mode-both motion-safe:duration-200 motion-safe:ease-out">
          <CheckIcon weight="bold" />
        </span>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox, type CheckboxProps, type CheckboxVariant };
