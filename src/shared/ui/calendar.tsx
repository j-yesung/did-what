"use client";

import * as React from "react";
import { type DayButton, DayPicker, getDefaultClassNames, type Locale } from "react-day-picker";

import { CaretDownIcon, CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";

import { cn } from "@/shared/lib/utils";
import { Button, buttonVariants } from "@/shared/ui/button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  locale,
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
}) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "group/calendar bg-background in-data-[slot=card-content]:bg-transparent in-data-[slot=popover-content]:bg-transparent p-2 [--cell-radius:var(--radius-md)] [--cell-size:--spacing(7)] [&_.rdp-range_start.rdp-range_end]:after:hidden",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className,
      )}
      captionLayout={captionLayout}
      locale={locale}
      formatters={{
        formatMonthDropdown: (date) => date.toLocaleString(locale?.code, { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn("relative flex flex-col gap-4 md:flex-row", defaultClassNames.months),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        nav: cn("absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1", defaultClassNames.nav),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) min-w-0 select-none p-0 aria-disabled:opacity-50",
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) min-w-0 select-none p-0 aria-disabled:opacity-50",
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          "flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)",
          defaultClassNames.month_caption,
        ),
        dropdowns: cn(
          "flex h-(--cell-size) w-full items-center justify-center gap-1.5 font-medium text-sm",
          defaultClassNames.dropdowns,
        ),
        dropdown_root: cn("relative rounded-(--cell-radius)", defaultClassNames.dropdown_root),
        dropdown: cn("absolute inset-0 bg-popover opacity-0", defaultClassNames.dropdown),
        caption_label: cn(
          "select-none font-medium",
          captionLayout === "label"
            ? "text-sm"
            : "flex items-center gap-1 rounded-(--cell-radius) text-sm [&>svg]:size-3.5 [&>svg]:text-muted-foreground",
          defaultClassNames.caption_label,
        ),
        month_grid: cn("w-full border-collapse", defaultClassNames.month_grid),
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "flex-1 select-none rounded-(--cell-radius) font-normal text-[0.8rem] text-muted-foreground",
          defaultClassNames.weekday,
        ),
        week: cn("mt-2 flex w-full", defaultClassNames.week),
        week_number_header: cn("w-(--cell-size) select-none", defaultClassNames.week_number_header),
        week_number: cn("select-none text-[0.8rem] text-muted-foreground", defaultClassNames.week_number),
        day: cn(
          "group/day relative aspect-square h-full w-full flex-1 select-none rounded-(--cell-radius) p-0 text-center",
          defaultClassNames.day,
        ),
        range_start: cn(
          "relative isolate after:absolute after:top-1/2 after:right-0 after:left-1/2 after:-z-10 after:h-9 after:-translate-y-1/2 after:bg-pressed",
          defaultClassNames.range_start,
        ),
        range_middle: cn(
          "relative isolate rounded-none after:absolute after:inset-x-0 after:top-1/2 after:-z-10 after:h-9 after:-translate-y-1/2 after:bg-pressed",
          defaultClassNames.range_middle,
        ),
        range_end: cn(
          "relative isolate after:absolute after:top-1/2 after:right-1/2 after:left-0 after:-z-10 after:h-9 after:-translate-y-1/2 after:bg-pressed",
          defaultClassNames.range_end,
        ),
        today: cn(
          "text-foreground [&:not([data-selected])_button>span]:bg-muted dark:[&:not([data-selected])_button>span]:bg-input/30 [&_button>span]:size-9 [&_button>span]:justify-center [&_button>span]:rounded-full",
          defaultClassNames.today,
        ),
        outside: cn("text-muted-foreground aria-selected:text-muted-foreground", defaultClassNames.outside),
        disabled: cn("text-muted-foreground opacity-50", defaultClassNames.disabled),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return <div data-slot="calendar" ref={rootRef} className={cn(className)} {...props} />;
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return <CaretLeftIcon className={cn("size-4", className)} {...props} />;
          }

          if (orientation === "right") {
            return <CaretRightIcon className={cn("size-4", className)} {...props} />;
          }

          return <CaretDownIcon className={cn("size-4", className)} {...props} />;
        },
        DayButton: ({ ...props }) => <CalendarDayButton locale={locale} {...props} />,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-(--cell-size) items-center justify-center text-center">{children}</div>
            </td>
          );
        },
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  color: _color,
  ...props
}: React.ComponentProps<typeof DayButton> & { locale?: Partial<Locale> }) {
  void _color;

  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  const active = modifiers.range_start || modifiers.range_end || (modifiers.selected && !modifiers.range_middle);

  return (
    <Button
      ref={ref}
      variant="ghost"
      data-active={active}
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "isolate z-10 aspect-square size-auto w-full min-w-0 flex-col border-transparent! p-0 font-normal leading-none focus-visible:ring-0 data-[range-middle=true]:rounded-none data-[active=true]:text-primary-foreground data-[range-middle=true]:text-foreground [&>span]:relative [&>span]:z-20 [&>span]:text-xs [&>span]:opacity-70 focus-visible:[&>span]:size-9 focus-visible:[&>span]:justify-center focus-visible:[&>span]:rounded-full focus-visible:[&>span]:ring-[3px] focus-visible:[&>span]:ring-ring/50 data-[active=true]:[&>span]:size-9 data-[active=true]:[&>span]:justify-center data-[active=true]:[&>span]:rounded-full data-[active=true]:[&>span]:bg-primary data-[active=true]:[&>span]:opacity-100",
        className,
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
