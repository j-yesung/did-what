"use client";

import * as React from "react";

import { FOCUS_RING } from "@/shared/lib/interaction";
import { cn } from "@/shared/lib/utils";

type SegmentedControlSize = "small" | "large";

type SegmentedControlContextValue = {
  name?: string;
  onValueChange?: (value: string) => void;
  size: SegmentedControlSize;
  value: string;
};

const SegmentedControlContext = React.createContext<SegmentedControlContextValue | null>(null);

const SEGMENTED_CONTROL_SIZE: Record<SegmentedControlSize, string> = {
  small: "h-10",
  large: "h-13",
};

const SEGMENTED_CONTROL_ITEM_SIZE: Record<SegmentedControlSize, string> = {
  small: "h-8 text-sm",
  large: "h-11 text-sm",
};

const SEGMENTED_CONTROL_PADDING_PX = 4;

const SEGMENTED_CONTROL_ITEM =
  "relative z-10 flex min-w-0 flex-1 cursor-pointer transition-transform duration-150 ease-out has-disabled:cursor-not-allowed has-disabled:opacity-50";

const SEGMENTED_CONTROL_ITEM_SURFACE =
  "flex w-full items-center justify-center rounded-lg px-2 font-medium text-muted-foreground transition-colors duration-200 ease-out";

type SegmentedControlProps = Omit<React.ComponentProps<"div">, "onChange"> & {
  name?: string;
  onValueChange?: (value: string) => void;
  size?: SegmentedControlSize;
  value: string;
};

function SegmentedControl({
  children,
  className,
  name,
  onValueChange,
  size = "small",
  style,
  value,
  ...props
}: SegmentedControlProps) {
  const items = React.Children.toArray(children);
  const selectedIndex = Math.max(
    items.findIndex((item) => React.isValidElement<{ value?: string }>(item) && item.props.value === value),
    0,
  );

  return (
    <SegmentedControlContext.Provider value={{ name, onValueChange, size, value }}>
      <div
        className={cn("relative flex w-full rounded-xl bg-muted p-1", SEGMENTED_CONTROL_SIZE[size], className)}
        data-size={size}
        data-slot="segmented-control"
        role="radiogroup"
        style={style}
        {...props}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-1 left-1 rounded-lg bg-surface shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] will-change-transform motion-reduce:transition-none"
          style={{
            transform: `translateX(${selectedIndex * 100}%)`,
            width: `calc((100% - ${SEGMENTED_CONTROL_PADDING_PX * 2}px) / ${Math.max(items.length, 1)})`,
          }}
        />
        {items}
      </div>
    </SegmentedControlContext.Provider>
  );
}

type SegmentedControlItemProps = Omit<
  React.ComponentProps<"input">,
  "checked" | "children" | "className" | "name" | "onChange" | "size" | "type" | "value"
> & {
  children: React.ReactNode;
  className?: string;
  render?: React.ReactElement<Record<string, unknown>>;
  value: string;
};

function SegmentedControlItem({ children, className, disabled, render, value, ...props }: SegmentedControlItemProps) {
  const context = React.useContext(SegmentedControlContext);

  if (!context) {
    throw new Error("SegmentedControlItem must be used within SegmentedControl.");
  }

  const checked = context.value === value;

  if (render) {
    return React.cloneElement(render, {
      "aria-current": checked ? "page" : undefined,
      children,
      className: cn(
        SEGMENTED_CONTROL_ITEM,
        SEGMENTED_CONTROL_ITEM_SURFACE,
        SEGMENTED_CONTROL_ITEM_SIZE[context.size],
        "touch-manipulation select-none [-webkit-tap-highlight-color:transparent] active:scale-[0.98]",
        checked && "text-foreground",
        FOCUS_RING,
        className,
      ),
      "data-slot": "segmented-control-item",
    });
  }

  return (
    <label
      className={cn(SEGMENTED_CONTROL_ITEM, "has-active:scale-[0.98]", className)}
      data-slot="segmented-control-item"
    >
      <input
        {...props}
        checked={checked}
        className="peer sr-only"
        disabled={disabled}
        name={context.name}
        onChange={() => context.onValueChange?.(value)}
        type="radio"
        value={value}
      />
      <span
        className={cn(
          SEGMENTED_CONTROL_ITEM_SURFACE,
          SEGMENTED_CONTROL_ITEM_SIZE[context.size],
          "peer-checked:text-foreground peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50",
        )}
      >
        {children}
      </span>
    </label>
  );
}

export { SegmentedControl, SegmentedControlItem, type SegmentedControlItemProps, type SegmentedControlProps };
