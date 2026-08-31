import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { FOCUS_RING } from "@/shared/lib/interaction";
import { cn } from "@/shared/lib/utils";
import { Spinner } from "@/shared/ui/spinner";

const buttonVariants = cva(
  cn(
    "relative inline-flex shrink-0 cursor-pointer touch-manipulation select-none items-center justify-center whitespace-nowrap rounded-lg border border-transparent bg-clip-padding font-medium text-sm transition-transform duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)] after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:opacity-0 after:transition-opacity after:duration-[350ms] after:ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:border-ring active:scale-[0.96] active:duration-[200ms] active:ease-[cubic-bezier(0.2,0,0,1)] active:after:opacity-[0.26] disabled:pointer-events-none disabled:opacity-50 disabled:after:opacity-0 motion-reduce:active:scale-100",
    FOCUS_RING,
  ),
  {
    variants: {
      variant: {
        fill: "after:bg-black",
        weak: "after:bg-current",
        neutral: "bg-muted text-muted-foreground after:bg-current",
        outline:
          "border-border bg-background after:bg-current aria-expanded:bg-muted dark:border-input dark:bg-input/30",
        ghost: "after:bg-current aria-expanded:bg-muted aria-expanded:text-foreground",
      },
      color: {
        primary: "",
        danger: "",
        light: "",
        dark: "",
      },
      size: {
        small:
          "h-8 min-w-13 gap-1 px-2.5 font-semibold text-[13px] leading-[1.252] has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        medium:
          "h-[38px] min-w-16 gap-1.5 px-4 font-semibold text-[15px] leading-[1.252] has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        large:
          "h-12 min-w-20 gap-1.5 px-4 font-semibold text-[17px] leading-[1.252] has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        xlarge:
          "h-14 min-w-24 gap-2 px-7 font-semibold text-[17px] leading-[1.252] has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        field: "h-auto min-h-12 gap-3 px-3 py-2 text-left",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    compoundVariants: [
      {
        color: "primary",
        variant: "fill",
        class: "bg-primary text-primary-foreground",
      },
      {
        color: "danger",
        variant: "fill",
        class: "bg-danger-fill text-danger-fill-foreground focus-visible:ring-danger-fill/30",
      },
      {
        color: "light",
        variant: "fill",
        class: "bg-light text-light-foreground",
      },
      {
        color: "dark",
        variant: "fill",
        class: "bg-dark text-dark-foreground",
      },
      {
        color: "primary",
        variant: "weak",
        class: "bg-primary/10 text-primary aria-expanded:bg-primary/15",
      },
      {
        color: "danger",
        variant: "weak",
        class: "bg-destructive/10 text-destructive aria-expanded:bg-destructive/15",
      },
      {
        color: "light",
        variant: "weak",
        class: "bg-light/10 text-light aria-expanded:bg-light/15",
      },
      {
        color: "dark",
        variant: "weak",
        class: "bg-dark/10 text-dark aria-expanded:bg-dark/15",
      },
    ],
    defaultVariants: {
      color: "primary",
      variant: "fill",
      size: "small",
      fullWidth: false,
    },
  },
);

type ButtonProps = Omit<ButtonPrimitive.Props, "color" | "size"> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean;
  };

function Button({
  children,
  className,
  disabled,
  loading,
  color = "primary",
  fullWidth = false,
  variant = "fill",
  size = "small",
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ color, fullWidth, size, variant }), className)}
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
