import type * as React from "react";

import { FOCUS_RING } from "@/shared/lib/interaction";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

type ListRowProps = Omit<React.ComponentProps<typeof Button>, "children"> & {
  children: React.ReactNode;
  right?: React.ReactNode;
};

const LIST_ROW_CLASS_NAME =
  "relative flex cursor-pointer touch-manipulation select-none items-center gap-3 whitespace-normal rounded-none px-5 py-3 text-left transition-transform duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] after:pointer-events-none after:absolute after:inset-0 after:rounded-xl after:bg-current after:opacity-0 after:transition-opacity after:duration-350 after:ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.96] active:duration-200 active:ease-[cubic-bezier(0.2,0,0,1)] active:after:opacity-[0.06] disabled:pointer-events-none disabled:cursor-default disabled:opacity-50 disabled:after:opacity-0 motion-reduce:active:scale-100";

function ListRowContent({ children, right }: Pick<ListRowProps, "children" | "right">) {
  return (
    <span className="flex w-full min-w-0 items-center justify-between gap-3">
      <span className="min-w-0 flex-1">{children}</span>
      {right ? <span className="shrink-0">{right}</span> : null}
    </span>
  );
}

function ListRow({ children, className, right, ...props }: ListRowProps) {
  return (
    <Button
      className={cn(LIST_ROW_CLASS_NAME, "h-auto min-w-0 [&>span]:w-full", FOCUS_RING, className)}
      fullWidth
      variant="ghost"
      {...props}
    >
      <ListRowContent right={right}>{children}</ListRowContent>
    </Button>
  );
}

type ListRowTextsProps = React.ComponentProps<"span"> & {
  description?: React.ReactNode;
  title: React.ReactNode;
};

function ListRowTexts({ className, description, title, ...props }: ListRowTextsProps) {
  return (
    <span className={cn("flex min-w-0 flex-col gap-0.5", className)} {...props}>
      <span className="line-clamp-2 break-keep font-medium text-foreground text-sm leading-[1.4]">{title}</span>
      {description ? (
        <span className="line-clamp-2 break-keep text-muted-foreground text-xs leading-[1.45]">{description}</span>
      ) : null}
    </span>
  );
}

export { ListRow, ListRowTexts };
