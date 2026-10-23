"use client";

import { useState } from "react";

import { SlidersHorizontalIcon } from "@phosphor-icons/react";

import type { RecordSort } from "@/entities/record";
import { formatDateRange, formatRecordDate } from "@/shared/lib/date/format-date";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { Button } from "@/shared/ui/button";
import { DateInput } from "@/shared/ui/date-input";
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

const getPeriodLabel = (period: RecordPeriod) => formatDateRange(period, formatRecordDate) || "전체 기간";

export function RecordFilterBottomSheet({ from, onApply, sort, to }: RecordPeriodFilterProps) {
  const [open, setOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<RecordPeriod>({ from, to });
  const [draftSort, setDraftSort] = useState(sort);

  const period = { from, to };
  const hasFilters = Boolean(from || to) || sort !== "recent";
  const hasDraft = Boolean(draftRange.from || draftRange.to || draftSort !== "recent");
  const invalid = Boolean(draftRange.from && draftRange.to && draftRange.to < draftRange.from);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setDraftRange(period);
      setDraftSort(sort);
    }
  };

  const handleApply = () => {
    if (invalid) return;
    onApply({
      from: draftRange.from,
      sort: draftSort,
      to: draftRange.to,
    });
    setOpen(false);
  };

  const handleClear = () => {
    setDraftRange({ from: "", to: "" });
    setDraftSort("recent");
  };

  return (
    <BottomSheet onOpenChange={handleOpenChange} open={open} showSwipeHandle>
      <BottomSheet.Trigger
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

      <BottomSheet.Content>
        <BottomSheet.Header>
          <BottomSheet.Title className="text-left font-bold text-xl">기록 필터</BottomSheet.Title>
        </BottomSheet.Header>
        <div className="flex min-h-0 flex-col gap-6 overflow-y-auto overscroll-contain px-5 py-6">
          <section aria-labelledby="record-sort-title">
            <h3 className="mb-3 font-semibold text-sm" id="record-sort-title">
              정렬
            </h3>
            <SegmentedControl
              aria-labelledby="record-sort-title"
              name="record-filter-sort"
              size="large"
              onValueChange={(value) => setDraftSort(value as RecordSort)}
              value={draftSort}
            >
              <SegmentedControlItem value="recent">최신순</SegmentedControlItem>
              <SegmentedControlItem value="oldest">오래된순</SegmentedControlItem>
            </SegmentedControl>
          </section>

          <section aria-labelledby="record-period-title">
            <h3 className="mb-3 font-semibold text-sm" id="record-period-title">
              기간
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Field className="min-w-0">
                <FieldLabel htmlFor="filter-start-date">첫날</FieldLabel>
                <DateInput
                  id="filter-start-date"
                  onChange={(event) => setDraftRange((current) => ({ ...current, from: event.target.value }))}
                  placeholder="처음부터"
                  value={draftRange.from}
                />
              </Field>
              <Field className="min-w-0" data-invalid={invalid}>
                <FieldLabel htmlFor="filter-end-date">마지막 날</FieldLabel>
                <DateInput
                  aria-describedby={invalid ? "filter-date-error" : undefined}
                  aria-invalid={invalid}
                  id="filter-end-date"
                  onChange={(event) => setDraftRange((current) => ({ ...current, to: event.target.value }))}
                  placeholder="마지막까지"
                  value={draftRange.to}
                />
              </Field>
            </div>
            {invalid ? (
              <p className="mt-2 text-destructive text-xs" id="filter-date-error" role="alert">
                마지막 날은 첫날과 같거나 이후여야 해요.
              </p>
            ) : null}
          </section>
        </div>

        <BottomSheet.Footer className="flex-row">
          <Button disabled={!hasDraft} onClick={handleClear} size="large" type="button" variant="neutral">
            초기화
          </Button>
          <Button className="min-w-0 flex-1" disabled={invalid} onClick={handleApply} size="large" type="button">
            적용
          </Button>
        </BottomSheet.Footer>
      </BottomSheet.Content>
    </BottomSheet>
  );
}
