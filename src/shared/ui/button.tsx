import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/utils";
import { Spinner } from "@/shared/ui/spinner";

import { FOCUS_RING } from "#shared/lib/interaction.ts";

const buttonVariants = cva(
  cn(
    "relative inline-flex shrink-0 cursor-pointer touch-manipulation select-none items-center justify-center whitespace-nowrap rounded-lg border border-transparent bg-clip-padding font-medium text-sm transition-transform duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)] after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:opacity-0 after:transition-opacity after:duration-[350ms] after:ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:border-ring active:scale-[0.96] active:duration-[200ms] active:ease-[cubic-bezier(0.2,0,0,1)] active:after:opacity-[0.26] disabled:pointer-events-none disabled:opacity-50 disabled:after:opacity-0 motion-reduce:active:scale-100",
    FOCUS_RING,
  ),
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground after:bg-black",
        neutral: "bg-muted text-muted-foreground after:bg-current",
        outline:
          "border-border bg-background after:bg-current aria-expanded:bg-muted dark:border-input dark:bg-input/30",
        secondary: "bg-secondary text-secondary-foreground after:bg-primary aria-expanded:bg-secondary",
        ghost: "after:bg-current aria-expanded:bg-muted aria-expanded:text-foreground",
        destructive: "bg-danger-fill text-danger-fill-foreground after:bg-black focus-visible:ring-danger-fill/30",
        link: "text-primary underline underline-offset-4 after:bg-current",
      },
      size: {
        default: "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 in-data-[slot=button-group]:rounded-lg rounded-[min(var(--radius-md),10px)] px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 in-data-[slot=button-group]:rounded-lg rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 in-data-[slot=button-group]:rounded-lg rounded-[min(var(--radius-md),10px)] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 in-data-[slot=button-group]:rounded-lg rounded-[min(var(--radius-md),12px)]",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean;
  };

function Button({
  children,
  className,
  disabled,
  loading,
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size, className }))}
      data-slot="button"
      disabled={disabled || loading}
      {...props}
    >
      <span className={cn("inline-flex items-center gap-[inherit]", loading && "opacity-0")}>{children}</span>
      {loading ? <Spinner aria-hidden="true" className="absolute" /> : null}
    </ButtonPrimitive>
  );
}

export { Button, buttonVariants };
