import type * as React from "react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

type ListRowProps = Omit<React.ComponentProps<typeof Button>, "children"> & {
  children: React.ReactNode;
  right?: React.ReactNode;
};

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
      className={cn(
        "flex h-auto min-w-0 gap-3 whitespace-normal rounded-none px-5 py-3 text-left after:rounded-xl active:after:opacity-[0.06] disabled:cursor-default [&>span]:w-full",
        className,
      )}
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
