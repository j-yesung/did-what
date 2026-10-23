"use client";

import { type SubmitEvent, useEffect, useState } from "react";

import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import { XIcon } from "@phosphor-icons/react";
import { format, parseISO } from "date-fns";

import { hasRecordFilters, isRecordCategory, RECORD_CATEGORY_OPTIONS, type RecordFilters } from "@/entities/record";
import { formatDateRange } from "@/shared/lib/date/format-date";
import { FOCUS_RING, PRESS_FEEDBACK } from "@/shared/lib/interaction";
import { cn } from "@/shared/lib/utils";
import { SearchField } from "@/shared/ui/search-field";

import { RecordFilterBottomSheet } from "./record-filter-bottom-sheet";

type RecordFilterFormProps = {
  filters: RecordFilters;
  onFiltersChange: (filters: RecordFilters) => void;
};

const formatFilterDate = (value: string) => format(parseISO(value), "M/d");

const getPeriodChipLabel = (period: Pick<RecordFilters, "from" | "to">) => formatDateRange(period, formatFilterDate);

export function RecordFilterForm({ filters, onFiltersChange }: RecordFilterFormProps) {
  const [query, setQuery] = useState(filters.query);
  const [syncedQuery, setSyncedQuery] = useState(filters.query);
  // 뒤로가기나 '전체 기록 보기'로 주소의 검색어가 바뀌면 입력칸도 따라간다.
  if (filters.query !== syncedQuery) {
    setSyncedQuery(filters.query);
    setQuery(filters.query);
  }
  const updateFilters = (overrides: Partial<RecordFilters>) => onFiltersChange({ ...filters, ...overrides });

  // 앱을 떠났다 돌아오면 필터 없는 목록에서 시작한다.
  useEffect(() => {
    if (!hasRecordFilters(filters)) return;

    const resetFiltersOnExit = () => {
      window.history.replaceState(window.history.state, "", "/records");
    };

    window.addEventListener("pagehide", resetFiltersOnExit);
    return () => window.removeEventListener("pagehide", resetFiltersOnExit);
  }, [filters]);

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateFilters({ query });
  };

  const handleFilterApply = (nextFilters: Pick<RecordFilters, "from" | "sort" | "to">) => {
    updateFilters({ query, ...nextFilters });
  };

  const filterChipClassName = cn(
    "inline-flex h-8 touch-manipulation items-center gap-1 rounded-full bg-secondary px-3 font-semibold text-secondary-foreground text-sm",
    "after:inset-0",
    FOCUS_RING,
    PRESS_FEEDBACK,
  );

  return (
    <form action="/records" className="flex flex-col gap-3" method="get" onSubmit={handleSubmit} role="search">
      <div className="flex items-start gap-2">
        <SearchField
          aria-label="기록 검색"
          className="min-w-0 flex-1"
          maxLength={100}
          name="q"
          // 글자만 지우고 결과는 그대로 두면 빈 검색창과 걸러진 목록이 어긋난다.
          onClear={() => {
            if (filters.query) updateFilters({ query: "" });
          }}
          onValueChange={setQuery}
          placeholder="활동, 메모, 지역으로 검색"
          value={query}
        />

        <input name="category" type="hidden" value={filters.category} />
        <input name="from" type="hidden" value={filters.from} />
        <input name="to" type="hidden" value={filters.to} />
        <input name="sort" type="hidden" value={filters.sort} />

        <RecordFilterBottomSheet from={filters.from} onApply={handleFilterApply} sort={filters.sort} to={filters.to} />
      </div>

      <ToggleGroup
        aria-label="기록 카테고리"
        className="flex gap-4 overflow-x-auto border-border border-b px-1"
        onValueChange={(values) => {
          // 이미 고른 탭을 다시 누르면 빈 값이 온다.
          if (values.length === 0) return;
          const category = values[0];
          updateFilters({ category: isRecordCategory(category) ? category : "", query });
        }}
        value={[filters.category || "all"]}
      >
        {[{ label: "전체", value: "all" }, ...RECORD_CATEGORY_OPTIONS].map((option) => (
          <Toggle
            className={cn(
              "h-11 shrink-0 border-transparent border-b-2 px-1 text-[13px] text-muted-foreground data-pressed:border-foreground data-pressed:font-semibold data-pressed:text-foreground",
              FOCUS_RING,
            )}
            key={option.value}
            type="button"
            value={option.value}
          >
            {option.label}
          </Toggle>
        ))}
      </ToggleGroup>

      {filters.from || filters.to || filters.sort !== "recent" ? (
        <div aria-label="적용 중인 필터" className="flex flex-wrap gap-2">
          {filters.from || filters.to ? (
            <button
              aria-label={`${getPeriodChipLabel(filters)} 기간 필터 제거`}
              className={filterChipClassName}
              onClick={() => handleFilterApply({ from: "", sort: filters.sort, to: "" })}
              type="button"
            >
              {getPeriodChipLabel(filters)}
              <XIcon aria-hidden="true" size={14} weight="bold" />
            </button>
          ) : null}
          {filters.sort === "oldest" ? (
            <button
              aria-label="오래된순 정렬 필터 제거"
              className={filterChipClassName}
              onClick={() => handleFilterApply({ from: filters.from, sort: "recent", to: filters.to })}
              type="button"
            >
              오래된순
              <XIcon aria-hidden="true" size={14} weight="bold" />
            </button>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
