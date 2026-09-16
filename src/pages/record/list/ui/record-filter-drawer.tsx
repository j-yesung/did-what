"use client";

import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { ko } from "react-day-picker/locale";

import { SlidersHorizontalIcon } from "@phosphor-icons/react";
import { format, parseISO } from "date-fns";

import type { RecordSort } from "@/entities/record";
import { Button } from "@/shared/ui/button";
import { Calendar } from "@/shared/ui/calendar";
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/shared/ui/drawer";
import { IconButton } from "@/shared/ui/icon-button";
import { SegmentedControl, SegmentedControlItem } from "@/shared/ui/segmented-control";

type RecordPeriod = {
  from: string;
  to: string;
};

type RecordPeriodFilterProps = RecordPeriod & {
  onApply: (filters: RecordPeriod & { sort: RecordSort }) => void;
  sort: RecordSort;
};

const toDateRange = ({ from, to }: RecordPeriod): DateRange | undefined => {
  if (!from && !to) return undefined;

  return {
    from: from ? parseISO(from) : undefined,
    to: to ? parseISO(to) : undefined,
  };
};

const formatDate = (value: string) => {
  return format(parseISO(value), "yyyy-MM-dd");
};

const getPeriodLabel = ({ from, to }: RecordPeriod) => {
  if (from && to) return from === to ? formatDate(from) : `${formatDate(from)} ~ ${formatDate(to)}`;
  if (from) return `${formatDate(from)}부터`;
  if (to) return `${formatDate(to)}까지`;
  return "전체 기간";
};

export function RecordFilterDrawer({ from, onApply, sort, to }: RecordPeriodFilterProps) {
  const [open, setOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<DateRange>();
  const [draftSort, setDraftSort] = useState(sort);
  const period = { from, to };
  const hasFilters = Boolean(from || to) || sort !== "recent";

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setDraftRange(toDateRange(period));
      setDraftSort(sort);
    }
  };

  const handleApply = () => {
    const start = draftRange?.from ?? draftRange?.to;
    const end = draftRange?.to ?? start;
    onApply({
      from: start ? format(start, "yyyy-MM-dd") : "",
      sort: draftSort,
      to: end ? format(end, "yyyy-MM-dd") : "",
    });
    setOpen(false);
  };

  const handleClear = () => {
    onApply({ from: "", sort: "recent", to: "" });
    setOpen(false);
  };

  return (
    <Drawer onOpenChange={handleOpenChange} open={open} showSwipeHandle>
      <DrawerTrigger
        render={
          <IconButton
            aria-label={`기록 필터, 기간 ${getPeriodLabel(period)}, 정렬 ${sort === "recent" ? "최신순" : "오래된순"}`}
            className="shrink-0"
            icon={SlidersHorizontalIcon}
            type="button"
            variant={hasFilters ? "fill" : "border"}
          />
        }
      />

      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>기록 필터</DrawerTitle>
        </DrawerHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-4">
          <section aria-labelledby="record-sort-title">
            <h3 className="mb-2 font-medium text-sm" id="record-sort-title">
              정렬
            </h3>
            <SegmentedControl
              aria-labelledby="record-sort-title"
              onValueChange={(value) => setDraftSort(value as RecordSort)}
              value={draftSort}
            >
              <SegmentedControlItem value="recent">최신순</SegmentedControlItem>
              <SegmentedControlItem value="oldest">오래된순</SegmentedControlItem>
            </SegmentedControl>
          </section>

          <section aria-labelledby="record-period-title">
            <h3 className="mb-2 font-medium text-sm" id="record-period-title">
              기간
            </h3>
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
          </section>
        </div>

        <DrawerFooter className="pb-[max(--spacing(4),env(safe-area-inset-bottom))]">
          {hasFilters ? (
            <Button onClick={handleClear} size="large" type="button" variant="neutral">
              필터 초기화
            </Button>
          ) : null}
          <Button fullWidth onClick={handleApply} size="large" type="button">
            적용
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
