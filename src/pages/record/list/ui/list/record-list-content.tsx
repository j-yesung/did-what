"use client";

import { useMemo } from "react";

import { usePathname, useSearchParams } from "next/navigation";

import { parseRecordFilters, type RecordFilters, setRecordFilterParams } from "@/entities/record";

import { RecordFilterForm } from "../filter/record-filter-form";
import { RecordList } from "./record-list";

// router.push는 서버에 화면을 다시 요청하므로 필터는 searchParams만 바꾸고 지금 주소에서 읽는다.
export function RecordListContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ?? "";
  const filters = useMemo(() => parseRecordFilters(Object.fromEntries(new URLSearchParams(search))), [search]);

  const changeFilters = (nextFilters: RecordFilters) => {
    const nextSearch = setRecordFilterParams(new URLSearchParams(search), nextFilters).toString();
    window.history.pushState(null, "", nextSearch ? `${pathname}?${nextSearch}` : pathname);
  };

  return (
    <>
      <RecordFilterForm filters={filters} onFiltersChange={changeFilters} />
      <RecordList filters={filters} onFiltersReset={() => changeFilters(parseRecordFilters({}))} />
    </>
  );
}
