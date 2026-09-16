"use client";

import { type SubmitEvent, useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { buildRecordsHref, type RecordFilters } from "@/entities/record";
import { SearchField } from "@/shared/ui/search-field";

import { RecordFilterDrawer } from "./record-filter-drawer";

type RecordFilterFormProps = {
  filters: RecordFilters;
};

export function RecordFilterForm({ filters }: RecordFilterFormProps) {
  const router = useRouter();
  const [query, setQuery] = useState(filters.query);

  useEffect(() => {
    setQuery(filters.query);
  }, [filters.query]);

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push(buildRecordsHref(filters, { query }));
  };

  const handleFilterApply = (nextFilters: Pick<RecordFilters, "from" | "sort" | "to">) => {
    router.push(buildRecordsHref({ ...filters, query, ...nextFilters }));
  };

  return (
    <form action="/records" className="flex items-start gap-2" method="get" onSubmit={handleSubmit} role="search">
      <SearchField
        aria-label="기록 검색"
        className="min-w-0 flex-1"
        maxLength={100}
        name="q"
        onValueChange={setQuery}
        placeholder="검색어를 입력하세요"
        value={query}
      />

      <input name="from" type="hidden" value={filters.from} />
      <input name="to" type="hidden" value={filters.to} />
      <input name="sort" type="hidden" value={filters.sort} />

      <RecordFilterDrawer from={filters.from} onApply={handleFilterApply} sort={filters.sort} to={filters.to} />
    </form>
  );
}
