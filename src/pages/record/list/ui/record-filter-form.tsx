"use client";

import { type SubmitEvent, useEffect, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { buildRecordsHref, hasRecordFilters, type RecordFilters, type RecordSort } from "@/entities/record";
import { cn } from "@/shared/lib/utils";
import { ResetButton } from "@/shared/ui/reset-button";
import { SearchField } from "@/shared/ui/search-field";

import { RecordPeriodFilter } from "./record-period-filter";

const SORT_OPTIONS: { label: string; value: RecordSort }[] = [
  { label: "최신순", value: "recent" },
  { label: "오래된순", value: "oldest" },
];

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
      <input name="sort" type="hidden" value={filters.sort} />

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

      <RecordPeriodFilter from={filters.from} onApply={handlePeriodApply} to={filters.to} />

      <div className="flex items-center gap-1.5">
        <div className="flex gap-1.5" role="group" aria-label="정렬">
          {SORT_OPTIONS.map(({ label, value }) => {
            const active = filters.sort === value;

            return (
              <Link
                aria-current={active ? "true" : undefined}
                className={cn(
                  "flex h-8 items-center rounded-md border px-3 font-[650] text-xs transition-colors",
                  active ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground",
                )}
                href={buildRecordsHref(filters, { sort: value })}
                key={value}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {hasRecordFilters(filters) ? (
          <ResetButton aria-label="기록 필터 초기화" className="ml-auto" onReset={() => router.push("/records")} />
        ) : null}
      </div>
    </form>
  );
}
