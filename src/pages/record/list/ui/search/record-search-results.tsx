"use client";

import { useLayoutEffect, useState } from "react";

import { parseRecordFilters } from "@/entities/record";
import { useRecordSearch } from "@/entities/record/ui/record-search-provider";

import { RecordList } from "../list/record-list";

export function RecordSearchResults() {
  const search = useRecordSearch();
  const [filterBottom, setFilterBottom] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (!search.query) return;
    const filters = document.querySelector<HTMLElement>("[data-record-filters]");
    if (!filters) {
      setFilterBottom(null);
      return;
    }
    const update = () => setFilterBottom(filters.getBoundingClientRect().bottom + 16);
    const observer = new ResizeObserver(update);
    observer.observe(filters);
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", update);
    };
  }, [search.query]);

  if (!search.query) return null;
  return (
    <section
      key={search.query}
      aria-label="전체 기록 검색"
      onScroll={search.collapseSearch}
      style={
        filterBottom === null
          ? undefined
          : { top: `max(calc(var(--page-top) + var(--toolbar-height) + 16px), ${filterBottom}px)` }
      }
      className="fixed inset-x-0 top-[calc(var(--page-top)+var(--toolbar-height)+--spacing(4))] bottom-(--nav-clearance) z-20 mx-auto flex max-w-(--app-width) flex-col overflow-y-auto overscroll-contain bg-background px-5"
    >
      <RecordList
        searchLoading
        filters={parseRecordFilters({ q: search.query })}
        emptyTitle={search.query ? `“${search.query}”에 해당하는 기록이 없어요` : "아직 남긴 기록이 없어요"}
      />
    </section>
  );
}
