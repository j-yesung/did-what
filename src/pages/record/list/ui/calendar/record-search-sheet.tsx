"use client";

import { useState } from "react";

import { useSearchParams } from "next/navigation";

import { clearRecordSearch, parseRecordFilters, readRecordQuery } from "@/entities/record";
import { BottomSheet } from "@/shared/ui/bottom-sheet";

import { useResetFiltersOnExit } from "../../model/use-reset-filters-on-exit";
import { RecordList } from "../list/record-list";

export function RecordSearchSheet() {
  const searchParams = useSearchParams();
  const query = readRecordQuery(searchParams);
  const [shownQuery, setShownQuery] = useState(query);
  if (query && query !== shownQuery) setShownQuery(query);
  useResetFiltersOnExit(Boolean(query));

  return (
    <BottomSheet
      onOpenChange={(open) => {
        if (!open) clearRecordSearch(window.history, searchParams?.toString() ?? "");
      }}
      open={Boolean(query)}
      showSwipeHandle
    >
      <BottomSheet.Content style={{ height: "75dvh" }}>
        <BottomSheet.Header>
          <BottomSheet.Title className="text-left font-bold text-xl">검색 결과</BottomSheet.Title>
        </BottomSheet.Header>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-5 pt-2 pb-6">
          {shownQuery ? (
            <RecordList emptyTitle="검색 결과가 없어요" filters={parseRecordFilters({ q: shownQuery })} />
          ) : null}
        </div>
      </BottomSheet.Content>
    </BottomSheet>
  );
}
