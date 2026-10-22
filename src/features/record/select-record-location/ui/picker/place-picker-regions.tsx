"use client";

import type { SubmitEvent } from "react";

import { ClockCounterClockwiseIcon, WarningCircleIcon } from "@phosphor-icons/react";

import { getRecordRegionKey } from "@/entities/record";
import type { useRegionSearch } from "@/entities/region";
import { getErrorMessage } from "@/shared/api/http/get-error-message";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { SearchField } from "@/shared/ui/search-field";

import type { PlacePickerDraft, RecordLocationRegion } from "../../model/location-picker";
import type { usePlacePickerSelection } from "../../model/use-place-picker-selection";
import { SelectablePlaceCard } from "./selectable-place-card";

type PlacePickerRegionsProps = {
  draft: Pick<PlacePickerDraft, "regionKeyword" | "regionQuery">;
  updateDraft: (patch: Partial<PlacePickerDraft>) => void;
  onSearch: (event: SubmitEvent<HTMLFormElement>) => void;
  search: ReturnType<typeof useRegionSearch>;
  recentRegions: RecordLocationRegion[];
  regions: RecordLocationRegion[];
  selection: Pick<ReturnType<typeof usePlacePickerSelection>, "addQueued" | "selectedRegionKeys" | "toggleRegion">;
};

export function PlacePickerRegions({
  draft,
  updateDraft,
  onSearch,
  search: regionSearch,
  recentRegions,
  regions,
  selection,
}: PlacePickerRegionsProps) {
  const { regionKeyword, regionQuery } = draft;
  const { addQueued, selectedRegionKeys, toggleRegion } = selection;
  return (
    <>
      <form aria-label="지역 검색" onSubmit={onSearch} role="search">
        <SearchField
          aria-label="지역 이름"
          loading={regionSearch.isFetching}
          maxLength={100}
          onClear={() => updateDraft({ regionKeyword: "", regionQuery: "" })}
          onValueChange={(regionKeyword) => updateDraft({ regionKeyword })}
          placeholder="예: 망원동, 홍대"
          value={regionKeyword}
        />
      </form>
      {!regionQuery && recentRegions.length ? (
        <section
          aria-label="최근 간 지역"
          className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pb-(--picker-bottom-space)"
        >
          <h3 className="flex items-center gap-1.5 font-semibold text-muted-foreground text-xs">
            <ClockCounterClockwiseIcon aria-hidden="true" className="size-3.5 text-foreground" />
            최근 간 지역
          </h3>
          <ul className="flex flex-col">
            {recentRegions.map((region) => {
              const key = getRecordRegionKey(region);
              const selected = selectedRegionKeys.has(key);
              const added = regions.some((item) => getRecordRegionKey(item) === key);
              return (
                <SelectablePlaceCard
                  added={added}
                  address={region.fullName}
                  disabled={added || addQueued}
                  key={key}
                  label="최근 간 지역"
                  name={region.label}
                  onSelect={() => toggleRegion(region)}
                  selected={selected}
                />
              );
            })}
          </ul>
        </section>
      ) : null}
      {regionSearch.isError ? (
        <Alert variant="destructive">
          <WarningCircleIcon aria-hidden="true" />
          <AlertDescription>{getErrorMessage(regionSearch.error)}</AlertDescription>
        </Alert>
      ) : null}
      {regionSearch.data?.related && regionSearch.data.regions.length ? (
        <p className="text-muted-foreground text-xs">입력한 검색어와 연관된 지역이에요.</p>
      ) : null}
      {regionSearch.data?.regions.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground text-sm">선택할 수 있는 지역이 없어요.</p>
      ) : null}
      {regionSearch.data?.regions.length ? (
        <ul
          aria-label="지역 검색 결과"
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-(--picker-bottom-space)"
        >
          {regionSearch.data.regions.map((region) => {
            const selectedRegion = {
              ...region,
              label: regionSearch.data?.query === regionQuery ? region.name : (regionSearch.data?.query ?? region.name),
            };
            const key = getRecordRegionKey(selectedRegion);
            const selected = selectedRegionKeys.has(key);
            const added = regions.some((item) => getRecordRegionKey(item) === key);
            return (
              <SelectablePlaceCard
                added={added}
                address={selectedRegion.fullName}
                disabled={added || addQueued}
                key={key}
                name={selectedRegion.label}
                onSelect={() => toggleRegion(selectedRegion)}
                selected={selected}
              />
            );
          })}
        </ul>
      ) : null}
    </>
  );
}
