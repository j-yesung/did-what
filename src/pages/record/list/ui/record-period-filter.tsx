"use client";

import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { ko } from "react-day-picker/locale";

import { CalendarDotsIcon } from "@phosphor-icons/react";
import { format, parseISO } from "date-fns";

import { Button } from "@/shared/ui/button";
import { Calendar } from "@/shared/ui/calendar";
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/shared/ui/drawer";

type RecordPeriod = {
  from: string;
  to: string;
};

type RecordPeriodFilterProps = RecordPeriod & {
  onApply: (period: RecordPeriod) => void;
};

function toDateRange({ from, to }: RecordPeriod): DateRange | undefined {
  if (!from && !to) return undefined;

  return {
    from: from ? parseISO(from) : undefined,
    to: to ? parseISO(to) : undefined,
  };
}

function formatDate(value: string) {
  return format(parseISO(value), "yyyy-MM-dd");
}

function getPeriodLabel({ from, to }: RecordPeriod) {
  if (from && to) return from === to ? formatDate(from) : `${formatDate(from)} ~ ${formatDate(to)}`;
  if (from) return `${formatDate(from)}부터`;
  if (to) return `${formatDate(to)}까지`;
  return "전체 기간";
}

export function RecordPeriodFilter({ from, onApply, to }: RecordPeriodFilterProps) {
  const [open, setOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<DateRange>();
  const period = { from, to };
  const hasPeriod = Boolean(from || to);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) setDraftRange(toDateRange(period));
  }

  function handleApply() {
    if (!draftRange?.from && !draftRange?.to) return;

    const start = draftRange.from ?? draftRange.to;
    if (!start) return;

    const end = draftRange.to ?? start;
    onApply({ from: format(start, "yyyy-MM-dd"), to: format(end, "yyyy-MM-dd") });
    setOpen(false);
  }

  function handleClear() {
    onApply({ from: "", to: "" });
    setOpen(false);
  }

  return (
    <div className="rounded-xl border bg-card px-4 py-3">
      <div className="mb-1.5 flex items-center gap-2 font-medium text-sm">
        <CalendarDotsIcon strokeWidth={2} className="size-4.5 text-foreground" aria-hidden="true" />
        기간
      </div>

      <Drawer onOpenChange={handleOpenChange} open={open} showSwipeHandle>
        <DrawerTrigger
          render={
            <Button className="justify-start [&>span]:w-full" fullWidth size="field" type="button" variant="outline" />
          }
        >
          <span className="flex w-full items-center justify-between gap-3">
            <span>{getPeriodLabel(period)}</span>
            <span className="shrink-0 text-muted-foreground text-xs">기간 설정</span>
          </span>
        </DrawerTrigger>

        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>어떤 기간을 볼까요?</DrawerTitle>
          </DrawerHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
            <Calendar
              className="w-full rounded-xl"
              classNames={{ root: "w-full" }}
              defaultMonth={draftRange?.from ?? draftRange?.to ?? new Date()}
              fixedWeeks
              locale={ko}
              mode="range"
              onSelect={setDraftRange}
              selected={draftRange}
            />
          </div>

          <DrawerFooter className="pb-[max(--spacing(4),env(safe-area-inset-bottom))]">
            {hasPeriod ? (
              <Button onClick={handleClear} size="large" type="button" variant="neutral">
                기간 초기화
              </Button>
            ) : null}
            <Button
              disabled={!draftRange?.from && !draftRange?.to}
              fullWidth
              onClick={handleApply}
              size="large"
              type="button"
            >
              기간 적용
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
