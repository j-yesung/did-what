"use client";

import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import { XIcon } from "@phosphor-icons/react";
import { format, parseISO } from "date-fns";
import { MotionConfig, motion } from "motion/react";

import { isRecordCategory, RECORD_CATEGORY_OPTIONS, type RecordFilters } from "@/entities/record";
import { formatDateRange } from "@/shared/lib/date/format-date";
import { FOCUS_RING } from "@/shared/lib/interaction";
import { cn } from "@/shared/lib/utils";
import { Chip } from "@/shared/ui/chip";

import { RecordFilterBottomSheet } from "./record-filter-bottom-sheet";

type RecordFilterFormProps = {
  filters: RecordFilters;
  onFiltersChange: (filters: RecordFilters) => void;
};

const formatFilterDate = (value: string) => format(parseISO(value), "M/d");

const getPeriodChipLabel = (period: Pick<RecordFilters, "from" | "to">) => formatDateRange(period, formatFilterDate);

export function RecordFilterForm({ filters, onFiltersChange }: RecordFilterFormProps) {
  const updateFilters = (overrides: Partial<RecordFilters>) => onFiltersChange({ ...filters, ...overrides });

  const handleFilterApply = (nextFilters: Pick<RecordFilters, "from" | "sort" | "to">) => {
    updateFilters(nextFilters);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 border-border border-b">
        <ToggleGroup
          aria-label="기록 카테고리"
          className="flex min-w-0 flex-1 gap-4 overflow-x-auto px-1"
          render={<motion.div layoutScroll />}
          onValueChange={(values) => {
            if (values.length === 0) return;
            const category = values[0];
            updateFilters({ category: isRecordCategory(category) ? category : "" });
          }}
          value={[filters.category || "all"]}
        >
          {[{ label: "전체", value: "all" }, ...RECORD_CATEGORY_OPTIONS].map((option) => (
            <Toggle
              className={cn(
                "relative h-11 shrink-0 px-1 text-[13px] text-muted-foreground data-pressed:font-semibold data-pressed:text-foreground",
                FOCUS_RING,
              )}
              key={option.value}
              type="button"
              value={option.value}
            >
              {option.label}
              {option.value === (filters.category || "all") ? (
                <MotionConfig reducedMotion="user">
                  <motion.span
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-foreground"
                    layoutId="record-category-underline"
                    transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
                  />
                </MotionConfig>
              ) : null}
            </Toggle>
          ))}
        </ToggleGroup>
        <RecordFilterBottomSheet from={filters.from} onApply={handleFilterApply} sort={filters.sort} to={filters.to} />
      </div>

      {filters.from || filters.to || filters.sort !== "recent" ? (
        <div aria-label="적용 중인 필터" className="flex flex-wrap gap-2">
          {filters.from || filters.to ? (
            <Chip
              aria-label={`${getPeriodChipLabel(filters)} 기간 필터 제거`}
              onClick={() => handleFilterApply({ from: "", sort: filters.sort, to: "" })}
              tone="brand"
            >
              {getPeriodChipLabel(filters)}
              <XIcon aria-hidden="true" size={14} weight="bold" />
            </Chip>
          ) : null}
          {filters.sort === "oldest" ? (
            <Chip
              aria-label="오래된순 정렬 필터 제거"
              onClick={() => handleFilterApply({ from: filters.from, sort: "recent", to: filters.to })}
              tone="brand"
            >
              오래된순
              <XIcon aria-hidden="true" size={14} weight="bold" />
            </Chip>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
