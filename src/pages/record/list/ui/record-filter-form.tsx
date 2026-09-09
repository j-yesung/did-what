"use client";

import { type SubmitEvent, useEffect, useState } from "react";

import { CaretUpDownIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

import { buildRecordsHref, hasRecordFilters, type RecordFilters, type RecordSort } from "@/entities/record";
import { ResetButton } from "@/shared/ui/reset-button";
import { SearchField } from "@/shared/ui/search-field";

import { RecordPeriodFilter } from "./record-period-filter";

type RecordFilterFormProps = {
  filters: RecordFilters;
};

export function RecordFilterForm({ filters }: RecordFilterFormProps) {
  const router = useRouter();
  const [query, setQuery] = useState(filters.query);

  useEffect(() => {
    setQuery(filters.query);
  }, [filters.query]);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const params = new URLSearchParams();
    for (const [key, value] of new FormData(event.currentTarget)) {
      if (typeof value === "string" && value) params.set(key, value);
    }

    router.push(`/records?${params.toString()}`);
  }

  function handlePeriodApply(period: Pick<RecordFilters, "from" | "to">) {
    router.push(buildRecordsHref({ ...filters, query, ...period }));
  }

  return (
    <form action="/records" className="flex flex-col gap-2.5" method="get" onSubmit={handleSubmit} role="search">
      <SearchField
        aria-label="기록 검색"
        maxLength={100}
        name="q"
        onValueChange={setQuery}
        placeholder="검색어를 입력하세요"
        value={query}
      />

      <input name="from" type="hidden" value={filters.from} />
      <input name="to" type="hidden" value={filters.to} />

      <div className="flex items-center gap-1.5">
        <RecordPeriodFilter from={filters.from} onApply={handlePeriodApply} to={filters.to} />

        <div className="relative shrink-0">
          <select
            aria-label="정렬"
            className="h-10 cursor-pointer touch-manipulation appearance-none rounded-lg border border-border bg-background py-0 pr-7 pl-2.5 font-semibold text-[13px] focus-visible:border-ring dark:border-input dark:bg-input/30"
            name="sort"
            onChange={(event) => router.push(buildRecordsHref(filters, { sort: event.target.value as RecordSort }))}
            value={filters.sort}
          >
            <option value="recent">최신순</option>
            <option value="oldest">오래된순</option>
          </select>
          <CaretUpDownIcon
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-muted-foreground"
            strokeWidth={2}
          />
        </div>

        {hasRecordFilters(filters) ? (
          <ResetButton aria-label="기록 필터 초기화" onReset={() => router.push("/records")} />
        ) : null}
      </div>
    </form>
  );
}
