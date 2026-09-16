"use client";

import { useState } from "react";

import { SlidersHorizontalIcon } from "@phosphor-icons/react";
import { format, parseISO } from "date-fns";

import type { RecordSort } from "@/entities/record";
import { Button } from "@/shared/ui/button";
import { DateInput } from "@/shared/ui/date-input";
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/shared/ui/drawer";
import { Field, FieldLabel } from "@/shared/ui/field";
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
  const [draftRange, setDraftRange] = useState<RecordPeriod>({ from, to });
  const [draftSort, setDraftSort] = useState(sort);

  const period = { from, to };
  const hasFilters = Boolean(from || to) || sort !== "recent";

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      const today = format(new Date(), "yyyy-MM-dd");
      setDraftRange(from || to ? period : { from: today, to: today });
      setDraftSort(sort);
    }
  };

  const handleApply = () => {
    if (draftRange.from && draftRange.to && draftRange.to < draftRange.from) return;
    const start = draftRange.from || draftRange.to;
    const end = draftRange.to || start;
    onApply({
      from: start,
      sort: draftSort,
      to: end,
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
            aria-pressed={hasFilters}
            className="shrink-0"
            icon={SlidersHorizontalIcon}
            type="button"
            variant={hasFilters ? "fill" : "border"}
          />
        }
      />

      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-left font-bold text-xl leading-7">기록 필터</DrawerTitle>
        </DrawerHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-4">
          <section aria-labelledby="record-sort-title">
            <h3 className="mb-2 font-semibold text-base" id="record-sort-title">
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
            <h3 className="mb-2 font-semibold text-base" id="record-period-title">
              기간
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Field className="min-w-0">
                <FieldLabel className="text-muted-foreground" htmlFor="filter-start-date">
                  시작일
                </FieldLabel>
                <DateInput
                  id="filter-start-date"
                  onChange={(event) => {
                    const value = event.target.value;
                    setDraftRange((current) => ({
                      from: value,
                      to: !current.to || current.to < value ? value : current.to,
                    }));
                  }}
                  value={draftRange.from}
                />
              </Field>
              <Field className="min-w-0">
                <FieldLabel className="text-muted-foreground" htmlFor="filter-end-date">
                  종료일
                </FieldLabel>
                <DateInput
                  id="filter-end-date"
                  min={draftRange.from || undefined}
                  onChange={(event) => setDraftRange((current) => ({ ...current, to: event.target.value }))}
                  value={draftRange.to}
                />
              </Field>
            </div>
          </section>
        </div>

        <DrawerFooter className="pb-[max(--spacing(4),env(safe-area-inset-bottom))]">
          {hasFilters ? (
            <Button onClick={handleClear} size="large" type="button" variant="neutral">
              필터 초기화
            </Button>
          ) : null}
          <Button
            disabled={Boolean(draftRange.from && draftRange.to && draftRange.to < draftRange.from)}
            fullWidth
            onClick={handleApply}
            size="large"
            type="button"
          >
            적용
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
