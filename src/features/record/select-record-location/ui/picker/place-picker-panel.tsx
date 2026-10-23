"use client";

import type { Dispatch, SetStateAction, SubmitEvent } from "react";

import { CheckIcon } from "@animateicons/react/lucide";
import { WarningCircleIcon, XIcon } from "@phosphor-icons/react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { type PlaceOption, placeSearchInfiniteQueryOptions } from "@/entities/place";
import { recordLocationsQueryOptions } from "@/entities/record";
import { regionSearchQueryOptions } from "@/entities/region/api/queries";
import { cn } from "@/shared/lib/utils";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { IconButton } from "@/shared/ui/icon-button";
import { LiquidGlassButton } from "@/shared/ui/liquid-glass-button";
import { Spinner } from "@/shared/ui/spinner";

import {
  type PlacePickerDraft,
  type PlacePickerMode,
  type RecordLocationPlace,
  type RecordLocationRegion,
  toRecentRegions,
} from "../../model/location-picker";
import { getPlacePickerResults } from "../../model/place-picker-results";
import { usePlacePickerSelection } from "../../model/use-place-picker-selection";
import { PlacePickerPlaces } from "./place-picker-places";
import { PlacePickerRegions } from "./place-picker-regions";

type PlacePickerPanelProps = {
  mode: PlacePickerMode;
  maxSelectionCount: number;
  onAdd: (places: RecordLocationPlace[], regions: RecordLocationRegion[]) => string | undefined;
  draft: PlacePickerDraft;
  onDraftChange: Dispatch<SetStateAction<PlacePickerDraft>>;
  searchRegionName?: string;
  regions: RecordLocationRegion[];
  selectedKeys: Set<string>;
  savedPlaces: PlaceOption[];
};

/** 좌표 없이 전국에서 찾는 칩. 지역 칩과 같은 목록에 들어가므로 코드 자리를 하나 비워 둔다. */
const NATIONWIDE_CODE = "";

export function PlacePickerPanel({
  mode,
  maxSelectionCount,
  onAdd,
  regions,
  selectedKeys,
  savedPlaces,
  draft,
  onDraftChange,
  searchRegionName,
}: PlacePickerPanelProps) {
  const { keyword, query, regionKeyword, regionQuery } = draft;
  const updateDraft = (patch: Partial<PlacePickerDraft>) => onDraftChange((current) => ({ ...current, ...patch }));
  const scopeCode = draft.scopeCode ?? regions[0]?.code ?? (searchRegionName ? "map" : NATIONWIDE_CODE);
  const scope = regions.find((region) => region.code === scopeCode);
  const searchQuery = scopeCode === "map" && query ? `${searchRegionName} ${query}` : query;
  const queryTooLong = searchQuery.length > 100;
  const searchParams = { latitude: scope?.latitude, longitude: scope?.longitude, query: searchQuery };
  const search = useInfiniteQuery({
    ...placeSearchInfiniteQueryOptions(searchParams),
    enabled: mode === "places" && Boolean(query) && !queryTooLong,
  });
  const results = getPlacePickerResults(savedPlaces, regions, query, search.data?.pages ?? []);
  const selection = usePlacePickerSelection({
    mode,
    maxSelectionCount,
    onAdd,
    draft,
    onDraftChange,
    regions,
    selectedKeys,
    savedByProviderId: results.savedByProviderId,
  });
  const { addQueued, addSelection, selectedCount, selectionError, setSelectionError } = selection;
  const showFloatingButton = selectedCount > 0 || Boolean(mode === "regions" ? regionQuery : query);
  const regionSearch = useQuery(regionSearchQueryOptions(mode === "regions" ? regionQuery : ""));
  const regionRecords = useQuery({ ...recordLocationsQueryOptions, enabled: mode === "regions" });
  const recentRegions = toRecentRegions(regionRecords.data ?? []);
  const handleSearch = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectionError(undefined);
    const nextQuery = keyword.trim();
    if (!nextQuery) return;

    if (nextQuery === query) {
      void search.refetch();
      return;
    }

    updateDraft({ query: nextQuery });
  };

  const handleRegionSearch = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectionError(undefined);
    const nextQuery = regionKeyword.trim();
    if (!nextQuery) return;
    if (nextQuery === regionQuery) {
      void regionSearch.refetch();
      return;
    }
    updateDraft({ regionQuery: nextQuery });
  };

  return (
    <>
      <BottomSheet.Header>
        <div className="flex items-center justify-between gap-3">
          <BottomSheet.Title className="text-left font-bold text-xl">
            {mode === "regions" ? "방문한 지역" : "방문한 곳"}
          </BottomSheet.Title>
          <BottomSheet.Close render={<IconButton aria-label="닫기" icon={XIcon} type="button" />} />
        </div>
        <BottomSheet.Description className="text-left">
          {mode === "regions" ? "어느 동네에서 시간을 보냈나요?" : "함께 다녀온 카페나 식당을 찾아보세요."}
        </BottomSheet.Description>
      </BottomSheet.Header>

      <div
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden px-5 pt-4 pb-0 data-error:[--picker-bottom-space:calc(280px+env(safe-area-inset-bottom))]",
          showFloatingButton
            ? "[--picker-bottom-space:calc(104px+env(safe-area-inset-bottom))]"
            : "[--picker-bottom-space:calc(16px+env(safe-area-inset-bottom))]",
        )}
        data-error={selectionError ? "" : undefined}
      >
        {mode === "regions" ? (
          <PlacePickerRegions
            draft={draft}
            updateDraft={updateDraft}
            onSearch={handleRegionSearch}
            search={regionSearch}
            recentRegions={recentRegions}
            regions={regions}
            selection={selection}
          />
        ) : (
          <PlacePickerPlaces
            draft={draft}
            updateDraft={updateDraft}
            onSearch={handleSearch}
            search={search}
            results={results}
            scopeCode={scopeCode}
            searchRegionName={searchRegionName}
            queryTooLong={queryTooLong}
            selectedKeys={selectedKeys}
            selection={selection}
          />
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-end gap-3 px-5 pt-4 pb-[calc(--spacing(6)+env(safe-area-inset-bottom))]">
        {selectionError ? (
          <Alert className="pointer-events-auto" variant="destructive">
            <WarningCircleIcon aria-hidden="true" />
            <AlertDescription>{selectionError}</AlertDescription>
          </Alert>
        ) : null}
        <span aria-live="polite" className="sr-only">
          선택한 곳 {selectedCount}곳
        </span>
        {showFloatingButton ? (
          <LiquidGlassButton
            aria-busy={addQueued || undefined}
            aria-label={selectedCount > 0 ? `${selectedCount}곳 추가` : "방문한 곳을 선택해 주세요"}
            className="h-12 min-w-0 border border-border/50 bg-foreground! px-5 text-background text-sm [&_svg]:size-5"
            disabled={selectedCount === 0 || addQueued}
            onClick={addSelection}
            title={selectedCount > 0 ? `${selectedCount}곳 추가` : "방문한 곳을 선택해 주세요"}
            shape="pill"
            type="button"
          >
            {addQueued ? (
              <Spinner aria-hidden="true" />
            ) : (
              <CheckIcon aria-hidden="true" className="stroke-current [stroke-linejoin:round] [stroke-width:8]" />
            )}
            <span>{selectedCount}곳 추가</span>
          </LiquidGlassButton>
        ) : null}
      </div>
    </>
  );
}
