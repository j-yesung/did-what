import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/utils";
import { Spinner } from "@/shared/ui/spinner";

import { FOCUS_RING, PRESS_FEEDBACK } from "#shared/lib/interaction.ts";

const buttonVariants = cva(
  cn(
    "inline-flex shrink-0 touch-manipulation select-none items-center justify-center whitespace-nowrap rounded-lg border border-transparent bg-clip-padding font-medium text-sm after:inset-0 focus-visible:border-ring disabled:pointer-events-none disabled:opacity-50",
    FOCUS_RING,
    PRESS_FEEDBACK,
  ),
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        neutral: "bg-muted text-muted-foreground",
        outline: "border-border bg-background aria-expanded:bg-muted dark:border-input dark:bg-input/30",
        secondary: "bg-secondary text-secondary-foreground aria-expanded:bg-secondary",
        ghost: "aria-expanded:bg-muted aria-expanded:text-foreground",
        destructive: "bg-danger-fill text-danger-fill-foreground focus-visible:ring-danger-fill/30",
        link: "text-primary underline underline-offset-4",
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
      {/**
       * 로딩 중에도 내용을 자리에 남겨 버튼 너비가 흔들리지 않게 한다.
       * visibility가 아니라 투명도로 감춘다. visibility:hidden은 접근성 트리에서도 빠져 버튼 이름이 사라진다.
       */}
      <span className={cn("inline-flex items-center gap-[inherit]", loading && "opacity-0")}>{children}</span>
      {loading ? <Spinner aria-hidden="true" className="absolute" /> : null}
    </ButtonPrimitive>
  );
}

export { Button, buttonVariants };
