"use client";

import { type SubmitEvent, useEffect, useState, useTransition } from "react";

import { XIcon } from "@phosphor-icons/react";
import { format, parseISO } from "date-fns";
import { useRouter } from "next/navigation";

import { buildRecordsHref, hasRecordFilters, type RecordFilters } from "@/entities/record";
import { FOCUS_RING, PRESS_FEEDBACK } from "@/shared/lib/interaction";
import { cn } from "@/shared/lib/utils";
import { SearchField } from "@/shared/ui/search-field";

import { RecordFilterBottomSheet } from "./record-filter-bottom-sheet";

type RecordFilterFormProps = {
  filters: RecordFilters;
};

const formatFilterDate = (value: string) => format(parseISO(value), "M/d");

const getPeriodChipLabel = ({ from, to }: Pick<RecordFilters, "from" | "to">) => {
  if (from && to) return from === to ? formatFilterDate(from) : `${formatFilterDate(from)} ~ ${formatFilterDate(to)}`;
  if (from) return `${formatFilterDate(from)}부터`;
  return `${formatFilterDate(to)}까지`;
};

export function RecordFilterForm({ filters }: RecordFilterFormProps) {
  const router = useRouter();
  const [query, setQuery] = useState(filters.query);
  // 목록을 새로 받는 동안 검색창에 진행 표시를 띄운다.
  const [navigating, startNavigation] = useTransition();
  const navigate = (href: string) => startNavigation(() => router.push(href));

  useEffect(() => {
    setQuery(filters.query);
  }, [filters.query]);

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
    navigate(buildRecordsHref(filters, { query }));
  };

  const handleFilterApply = (nextFilters: Pick<RecordFilters, "from" | "sort" | "to">) => {
    navigate(buildRecordsHref({ ...filters, query, ...nextFilters }));
  };

  const filterChipClassName = cn(
    "inline-flex h-8 touch-manipulation items-center gap-1 rounded-full bg-secondary px-3 font-semibold text-secondary-foreground text-sm",
    "after:inset-0",
    FOCUS_RING,
    PRESS_FEEDBACK,
  );

  return (
    <form action="/records" className="space-y-3" method="get" onSubmit={handleSubmit} role="search">
      <div className="flex items-start gap-2">
        <SearchField
          aria-label="기록 검색"
          className="min-w-0 flex-1"
          loading={navigating}
          maxLength={100}
          name="q"
          // 글자만 지우고 결과는 그대로 두면 빈 검색창과 걸러진 목록이 어긋난다.
          onClear={() => {
            if (filters.query) navigate(buildRecordsHref(filters, { query: "" }));
          }}
          onValueChange={setQuery}
          placeholder="활동, 메모, 지역으로 검색"
          value={query}
        />

        <input name="from" type="hidden" value={filters.from} />
        <input name="to" type="hidden" value={filters.to} />
        <input name="sort" type="hidden" value={filters.sort} />

        <RecordFilterBottomSheet from={filters.from} onApply={handleFilterApply} sort={filters.sort} to={filters.to} />
      </div>

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
