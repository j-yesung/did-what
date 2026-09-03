"use client";

import { type SubmitEvent, useState } from "react";

import { ClockCounterClockwiseIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";

import { recordLocationsQueryOptions } from "@/entities/record";
import { useRegionSearch } from "@/entities/region";
import { getErrorMessage } from "@/shared/api/http/get-error-message";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/shared/ui/drawer";
import { SearchField } from "@/shared/ui/search-field";

import type { RecordLocationRegion } from "../model/location-picker";
import { toRecentRegions } from "../model/location-picker";

type RegionSearchContentProps = {
  onSelect: (region: RecordLocationRegion) => void;
};

export function RegionSearchContent({ onSelect }: RegionSearchContentProps) {
  const [keyword, setKeyword] = useState("");
  const [query, setQuery] = useState("");
  const search = useRegionSearch(query);

  const records = useQuery({ ...recordLocationsQueryOptions, enabled: true });
  const recentRegions = toRecentRegions(records.data ?? []);

  function handleSearch(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    const nextQuery = keyword.trim();
    if (!nextQuery) return;

    if (nextQuery === query) {
      void search.refetch();
      return;
    }

    setQuery(nextQuery);
  }

  return (
    <DrawerContent className="[--drawer-height:var(--drawer-content-max-height)]">
      <DrawerHeader>
        <DrawerTitle>어느 지역에 갔나요?</DrawerTitle>
        <DrawerDescription>익숙한 지역명을 직접 입력해 보세요.</DrawerDescription>
      </DrawerHeader>

      <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 pb-[max(--spacing(4),env(safe-area-inset-bottom))]">
        {recentRegions.length ? (
          <section aria-labelledby="recent-region-quick-pick" className="flex flex-col gap-2">
            <h3
              className="flex items-center gap-1.5 px-0.5 font-[650] text-muted-foreground text-xs"
              id="recent-region-quick-pick"
            >
              <ClockCounterClockwiseIcon strokeWidth={2} className="size-3.5 text-foreground" aria-hidden="true" />
              최근 간 지역
            </h3>
            <ul className="flex flex-wrap gap-1.5">
              {recentRegions.map((region) => (
                <li key={region.code}>
                  <Button
                    className="rounded-lg"
                    onClick={() => onSelect(region)}
                    size="small"
                    title={region.fullName}
                    type="button"
                    variant="outline"
                  >
                    {region.label}
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <form aria-label="지역 검색" onSubmit={handleSearch} role="search">
          <SearchField
            aria-label="지역 이름"
            loading={search.isFetching}
            maxLength={100}
            onClear={() => setQuery("")}
            onValueChange={setKeyword}
            placeholder="예: 망원동, 홍대"
            value={keyword}
          />
        </form>

        {search.isError ? (
          <Alert variant="destructive">
            <WarningCircleIcon strokeWidth={2} aria-hidden="true" />
            <AlertDescription>{getErrorMessage(search.error)}</AlertDescription>
          </Alert>
        ) : null}

        {search.data?.regions.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground text-sm">선택할 수 있는 지역이 없어요.</p>
        ) : null}

        {search.data?.related && search.data.regions.length ? (
          <p className="text-muted-foreground text-xs">입력한 검색어와 연관된 지역이에요.</p>
        ) : null}

        {search.data?.regions.length ? (
          <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain pr-1">
            {search.data.regions.map((region) => (
              <li key={region.code}>
                <Button
                  className="h-auto justify-start whitespace-normal px-3 py-3 text-left"
                  fullWidth
                  onClick={() => onSelect({ ...region, label: search.data.query })}
                  type="button"
                  variant="outline"
                >
                  {region.fullName}
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </DrawerContent>
  );
}
