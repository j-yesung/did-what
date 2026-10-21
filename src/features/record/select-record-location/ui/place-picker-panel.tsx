"use client";

import { type Dispatch, type SetStateAction, type SubmitEvent, useEffect, useMemo, useRef, useState } from "react";

import { CheckIcon } from "@animateicons/react/lucide";
import { ClockCounterClockwiseIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";

import { getPlaceRegionLabel, type PlaceOption, type PlaceSearchResult, searchPlaces } from "@/entities/place";
import { getRecordRegionKey, MAX_VISITED_PLACES, recordLocationsQueryOptions } from "@/entities/record";
import { useRegionSearch } from "@/entities/region";
import { getErrorMessage } from "@/shared/api/http/get-error-message";
import { KAKAO_SEARCH_MAX_PAGE, type KakaoPlace } from "@/shared/api/kakao-local";
import { useActionOverride } from "@/shared/lib/action-override";
import { showToast } from "@/shared/lib/toast";
import { cn } from "@/shared/lib/utils";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { Button } from "@/shared/ui/button";
import { LiquidGlassButton } from "@/shared/ui/liquid-glass-button";
import { LoadMoreButton } from "@/shared/ui/load-more-button";
import { SearchField } from "@/shared/ui/search-field";
import { SegmentedControl, SegmentedControlItem } from "@/shared/ui/segmented-control";
import { Spinner } from "@/shared/ui/spinner";

import { resolveRecordPlace } from "../api/resolve-record-location";
import {
  getRecordLocationSelectionError,
  type PlacePickerDraft,
  type RecordLocationPlace,
  type RecordLocationRegion,
  toExistingRecordLocationPlace,
  toRecentRegions,
} from "../model/location-picker";
import { SelectablePlaceCard } from "./selectable-place-card";

type PlacePickerPanelProps = {
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

const showPlaceLimitToast = () =>
  showToast({ title: `장소는 ${MAX_VISITED_PLACES}곳까지 추가할 수 있어요.`, variant: "warning" });

export function PlacePickerPanel({
  maxSelectionCount,
  onAdd,
  regions,
  selectedKeys,
  savedPlaces,
  draft,
  onDraftChange,
  searchRegionName,
}: PlacePickerPanelProps) {
  const { tab, keyword, query, regionKeyword, regionQuery, selectedPlaces, selectedRegions } = draft;
  const updateDraft = (patch: Partial<PlacePickerDraft>) => onDraftChange((current) => ({ ...current, ...patch }));
  const setSelectedPlaces = (update: (current: Map<string, RecordLocationPlace>) => Map<string, RecordLocationPlace>) =>
    onDraftChange((current) => ({ ...current, selectedPlaces: update(current.selectedPlaces) }));
  const [selectionError, setSelectionError] = useState<string>();
  const scopeCode = draft.scopeCode ?? regions[0]?.code ?? (searchRegionName ? "map" : NATIONWIDE_CODE);
  const [pendingPlaceKeys, setPendingPlaceKeys] = useState<Set<string>>(() => new Set());
  const pendingRequests = useRef(new Map<string, symbol>());
  const optimisticSelectedKeys = useMemo(
    () => new Set([...selectedPlaces.keys(), ...pendingPlaceKeys]),
    [pendingPlaceKeys, selectedPlaces],
  );
  const selectedRegionKeys = useMemo(() => new Set(selectedRegions.keys()), [selectedRegions]);
  const selectedCount = optimisticSelectedKeys.size + selectedRegions.size;
  const showFloatingButton = selectedCount > 0 || (tab === "places" && Boolean(query));
  const scope = regions.find((region) => region.code === scopeCode);
  const searchQuery = scopeCode === "map" && query ? `${searchRegionName} ${query}` : query;
  const queryTooLong = searchQuery.length > 100;
  const searchParams = { latitude: scope?.latitude, longitude: scope?.longitude, query: searchQuery };
  const search = useInfiniteQuery({
    queryKey: ["places", "search", searchParams, "infinite"],
    queryFn: ({ pageParam, signal }) => searchPlaces({ ...searchParams, page: pageParam }, signal),
    enabled: tab === "places" && Boolean(query) && !queryTooLong,
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.isEnd || lastPage.page >= KAKAO_SEARCH_MAX_PAGE ? undefined : lastPage.page + 1,
    staleTime: 60_000,
  });
  const searchResults = (search.data?.pages ?? []).flatMap((page) => page.places.map((place) => ({ page, place })));
  const savedByProviderId = new Map(
    savedPlaces
      .filter((place) => place.provider === "kakao" && place.region_name)
      .map((place) => [place.provider_place_id, place]),
  );
  const inRegion = (place: PlaceOption) =>
    regions.some((region) => place.region_code.slice(0, 5) === region.code.slice(0, 5));
  const searchScopes = regions.filter(
    (region, index) => regions.findIndex((item) => item.code === region.code) === index,
  );
  const selectableSavedPlaces = savedPlaces
    .filter((place) => place.region_name)
    .toSorted((a, b) => Number(inRegion(b)) - Number(inRegion(a)));
  const savedMatches = query.trim()
    ? selectableSavedPlaces
        .filter(
          (place) =>
            `${place.name} ${place.address ?? ""} ${getPlaceRegionLabel(place.region_name, place.address)}`
              .toLocaleLowerCase("ko")
              .includes(query.trim().toLocaleLowerCase("ko")) ||
            searchResults.some(({ place: result }) => result.id === place.provider_place_id),
        )
        .filter((place) => place.region_name)
    : [];
  const savedMatchIds = new Set(savedMatches.map((place) => place.provider_place_id).filter(Boolean));
  const savedMatchNames = new Set(
    savedMatches.map((place) => `${place.name.trim().toLocaleLowerCase("ko")}|${place.address?.trim() ?? ""}`),
  );
  const uniqueSearchResults = searchResults.filter(({ place }) => {
    const providerMatch = savedMatchIds.has(place.id);
    const nameAddressMatch = savedMatchNames.has(
      `${place.name.trim().toLocaleLowerCase("ko")}|${place.address?.trim() ?? ""}`,
    );
    return !providerMatch && !nameAddressMatch;
  });
  const regionSearch = useRegionSearch(regionQuery);
  const regionRecords = useQuery({ ...recordLocationsQueryOptions, enabled: tab === "regions" });
  const recentRegions = toRecentRegions(regionRecords.data ?? []);
  const resolvePlace = useActionOverride(resolveRecordPlace);
  const resolve = useMutation({ mutationFn: resolvePlace });
  const resolving = pendingPlaceKeys.size > 0;
  const [addQueued, setAddQueued] = useState(false);

  useEffect(() => {
    if (!addQueued || resolving) return;
    setAddQueued(false);
    if (selectionError) return;
    if (selectedCount > 0) setSelectionError(onAdd([...selectedPlaces.values()], [...selectedRegions.values()]));
  }, [addQueued, onAdd, resolving, selectedCount, selectedPlaces, selectedRegions, selectionError]);

  const isSavedPlaceAdded = (place: PlaceOption) =>
    selectedKeys.has(`existing:${place.id}`) ||
    (place.provider === "kakao" && selectedKeys.has(`kakao:${place.provider_place_id}`));
  const toggleSavedPlace = (place: PlaceOption) => {
    const key = `existing:${place.id}`;
    if (!place.region_name || isSavedPlaceAdded(place) || addQueued) return;
    if (!selectedPlaces.has(key) && optimisticSelectedKeys.size >= maxSelectionCount) {
      showPlaceLimitToast();
      return;
    }
    setSelectionError(undefined);
    setSelectedPlaces((current) => {
      const next = new Map(current);
      if (next.has(key)) next.delete(key);
      else if (next.size < maxSelectionCount) next.set(key, toExistingRecordLocationPlace(place));
      return next;
    });
  };

  const toggleRegion = (region: RecordLocationRegion) => {
    const key = getRecordRegionKey(region);
    if (regions.some((item) => getRecordRegionKey(item) === key)) return;
    setSelectionError(undefined);
    const next = new Map(selectedRegions);
    if (next.has(key)) next.delete(key);
    else next.set(key, region);
    const error = getRecordLocationSelectionError([...regions, ...next.values()], [...selectedPlaces.values()]);
    if (error) {
      showToast({ title: error, variant: "warning" });
      return;
    }
    updateDraft({ selectedRegions: next });
  };

  const selectPlace = (place: KakaoPlace, searched: PlaceSearchResult) => {
    setSelectionError(undefined);
    const saved = savedByProviderId.get(place.id);
    if (saved) {
      toggleSavedPlace(saved);
      return;
    }
    const key = `kakao:${place.id}`;
    if (selectedKeys.has(key) || addQueued) return;

    if (pendingRequests.current.has(key)) {
      pendingRequests.current.delete(key);
      setPendingPlaceKeys((current) => {
        const next = new Set(current);
        next.delete(key);
        return next;
      });
      return;
    }

    if (optimisticSelectedKeys.has(key)) {
      setSelectedPlaces((current) => {
        const next = new Map(current);
        next.delete(key);
        return next;
      });
      return;
    }

    if (optimisticSelectedKeys.size >= maxSelectionCount) {
      showPlaceLimitToast();
      return;
    }

    setSelectionError(undefined);
    const request = Symbol(key);
    pendingRequests.current.set(key, request);
    setPendingPlaceKeys((current) => new Set(current).add(key));
    void (async () => {
      try {
        const result = await resolve.mutateAsync({
          page: searched.page,
          providerPlaceId: place.id,
          query: searched.query,
          scope: searched.scope,
        });
        // 해제하거나 다시 선택한 행은 이전 요청의 응답으로 덮어쓰지 않는다.
        if (pendingRequests.current.get(key) !== request) return;
        if ("error" in result) {
          setSelectionError(result.error);
          return;
        }

        setSelectedPlaces((current) => {
          if (current.size >= maxSelectionCount || selectedKeys.has(result.place.key)) return current;
          const next = new Map(current);
          next.set(result.place.key, {
            ...result.place,
            category_group_code: place.categoryGroupCode,
            category_name: place.categoryName,
          });
          return next;
        });
      } catch {
        if (pendingRequests.current.get(key) === request) {
          setSelectionError("장소를 확인하지 못했어요.\n잠시 후 다시 시도해 주세요.");
        }
      } finally {
        if (pendingRequests.current.get(key) === request) {
          pendingRequests.current.delete(key);
          setPendingPlaceKeys((current) => {
            const next = new Set(current);
            next.delete(key);
            return next;
          });
        }
      }
    })();
  };

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
        <BottomSheet.Title className="text-left font-bold text-xl">방문한 곳 추가</BottomSheet.Title>
        <BottomSheet.Description className="text-left">
          장소를 검색하거나 특정 장소 없이 지역만 남길 수 있어요.
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
        <SegmentedControl
          aria-label="방문한 곳 종류"
          name="visit-location-tab"
          size="large"
          onValueChange={(tab) => {
            if (tab !== "places" && tab !== "regions") return;
            setSelectionError(undefined);
            updateDraft({ tab });
          }}
          value={tab}
        >
          <SegmentedControlItem disabled={addQueued} value="places">
            장소
          </SegmentedControlItem>
          <SegmentedControlItem disabled={addQueued} value="regions">
            지역
          </SegmentedControlItem>
        </SegmentedControl>
        {tab === "regions" ? (
          <>
            <form aria-label="지역 검색" onSubmit={handleRegionSearch} role="search">
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
                    label:
                      regionSearch.data?.query === regionQuery
                        ? region.name
                        : (regionSearch.data?.query ?? region.name),
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
        ) : (
          <>
            {searchScopes.length || searchRegionName ? (
              <ul aria-label="검색 기준 지역" className="flex flex-wrap gap-1.5">
                {[
                  ...searchScopes.map((region) => ({ code: region.code, label: `${region.label} 주변` })),
                  ...(searchRegionName ? [{ code: "map", label: `${searchRegionName} 기준` }] : []),
                  { code: NATIONWIDE_CODE, label: "전국" },
                ].map((region) => (
                  <li key={region.code || "nationwide"}>
                    <Button
                      aria-pressed={region.code === scopeCode}
                      className="rounded-lg"
                      onClick={() => updateDraft({ scopeCode: region.code })}
                      size="small"
                      type="button"
                      variant={region.code === scopeCode ? "fill" : "outline"}
                    >
                      {region.label}
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}

            <form aria-label="방문 장소 검색" onSubmit={handleSearch} role="search">
              <SearchField
                aria-label="방문 장소 이름"
                loading={search.isFetching}
                maxLength={100}
                onClear={() => {
                  updateDraft({ query: "" });
                  setSelectionError(undefined);
                }}
                onValueChange={(keyword) => updateDraft({ keyword })}
                placeholder="예: 메가커피"
                value={keyword}
              />
            </form>

            {(search.isError && !search.data) || queryTooLong ? (
              <Alert variant="destructive">
                <WarningCircleIcon aria-hidden="true" />
                <AlertDescription>
                  {queryTooLong
                    ? "지역명을 포함해 100자까지 검색할 수 있어요. 검색어를 줄여 주세요."
                    : getErrorMessage(search.error)}
                </AlertDescription>
              </Alert>
            ) : null}

            {search.data && !savedMatches.length && !uniqueSearchResults.length ? (
              <p className="py-8 text-center text-muted-foreground text-sm">검색 결과가 없어요.</p>
            ) : null}

            {savedMatches.length || uniqueSearchResults.length ? (
              <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain p-1 pb-(--picker-bottom-space)">
                <ul aria-label="장소 검색 결과" className="flex flex-col">
                  {savedMatches.map((place) => {
                    const key = `existing:${place.id}`;
                    const added = isSavedPlaceAdded(place);
                    const selected = selectedPlaces.has(key);
                    return (
                      <SelectablePlaceCard
                        added={added}
                        address={place.address ?? "주소 정보 없음"}
                        disabled={added || addQueued}
                        key={place.id}
                        name={place.name}
                        onSelect={() => toggleSavedPlace(place)}
                        place={place}
                        saved
                        selected={selected}
                      />
                    );
                  })}
                  {uniqueSearchResults.map(({ page, place }) => {
                    const saved = savedByProviderId.get(place.id);
                    const key = saved ? `existing:${saved.id}` : `kakao:${place.id}`;
                    const added = saved ? isSavedPlaceAdded(saved) : selectedKeys.has(key);
                    const selected = optimisticSelectedKeys.has(key);
                    const pending = pendingPlaceKeys.has(key);
                    const disabled = added || addQueued;

                    return (
                      <SelectablePlaceCard
                        added={added}
                        address={place.address ?? "주소 정보 없음"}
                        disabled={disabled}
                        key={place.id}
                        name={place.name}
                        onSelect={() => selectPlace(place, page)}
                        place={{
                          category_group_code: place.categoryGroupCode,
                          category_name: place.categoryName,
                        }}
                        resolving={pending}
                        selected={selected}
                      />
                    );
                  })}
                </ul>
                {search.hasNextPage ? (
                  <LoadMoreButton
                    error={search.isFetchNextPageError ? "검색 결과를 더 불러오지 못했어요." : undefined}
                    loading={search.isFetchingNextPage}
                    onClick={() => void search.fetchNextPage()}
                  />
                ) : null}
              </div>
            ) : null}
          </>
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
            onClick={() => {
              if (resolving) {
                setAddQueued(true);
                return;
              }
              setSelectionError(onAdd([...selectedPlaces.values()], [...selectedRegions.values()]));
            }}
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
