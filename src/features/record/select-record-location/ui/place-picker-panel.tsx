"use client";

import {
  type Dispatch,
  type SetStateAction,
  type SubmitEvent,
  useEffect,
  useMemo,
  useOptimistic,
  useState,
  useTransition,
} from "react";

import { CheckIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";

import { type PlaceOption, type PlaceSearchResult, searchPlaces } from "@/entities/place";
import { getErrorMessage } from "@/shared/api/http/get-error-message";
import { KAKAO_SEARCH_MAX_PAGE, type KakaoPlace } from "@/shared/api/kakao-local";
import { useActionOverride } from "@/shared/lib/action-override";
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
  type PlacePickerDraft,
  type RecordLocationPlace,
  type RecordLocationRegion,
  toExistingRecordLocationPlace,
} from "../model/location-picker";
import { SelectablePlaceCard } from "./selectable-place-card";
import { SelectablePlaceGridItem } from "./selectable-place-grid-item";

type PlacePickerPanelProps = {
  maxSelectionCount: number;
  onAdd: (places: RecordLocationPlace[]) => string | undefined;
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
  maxSelectionCount,
  onAdd,
  regions,
  selectedKeys,
  savedPlaces,
  draft,
  onDraftChange,
  searchRegionName,
}: PlacePickerPanelProps) {
  const { tab, keyword, query, selectedPlaces } = draft;
  const updateDraft = (patch: Partial<PlacePickerDraft>) => onDraftChange((current) => ({ ...current, ...patch }));
  const setSelectedPlaces = (update: (current: Map<string, RecordLocationPlace>) => Map<string, RecordLocationPlace>) =>
    onDraftChange((current) => ({ ...current, selectedPlaces: update(current.selectedPlaces) }));
  const [selectionError, setSelectionError] = useState<string>();
  const scopeCode = draft.scopeCode ?? regions[0]?.code ?? (searchRegionName ? "map" : NATIONWIDE_CODE);
  const selectedPlaceKeys = useMemo(() => new Set(selectedPlaces.keys()), [selectedPlaces]);
  const [optimisticSelectedKeys, selectOptimistically] = useOptimistic(selectedPlaceKeys, (current, key: string) =>
    new Set(current).add(key),
  );
  const showFloatingButton = optimisticSelectedKeys.size > 0 || (tab === "search" && Boolean(query));
  const scope = regions.find((region) => region.code === scopeCode);
  const searchQuery = scopeCode === "map" && query ? `${searchRegionName} ${query}` : query;
  const queryTooLong = searchQuery.length > 100;
  const searchParams = { latitude: scope?.latitude, longitude: scope?.longitude, query: searchQuery };
  const search = useInfiniteQuery({
    queryKey: ["places", "search", searchParams, "infinite"],
    queryFn: ({ pageParam, signal }) => searchPlaces({ ...searchParams, page: pageParam }, signal),
    enabled: tab === "search" && Boolean(query) && !queryTooLong,
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.isEnd || lastPage.page >= KAKAO_SEARCH_MAX_PAGE ? undefined : lastPage.page + 1,
    staleTime: 60_000,
  });
  const searchResults = (search.data?.pages ?? []).flatMap((page) => page.places.map((place) => ({ page, place })));

  const resolvePlace = useActionOverride(resolveRecordPlace);
  const resolve = useMutation({ mutationFn: resolvePlace });
  /**
   * 장소는 서버에서 하나씩 확인한다. 확인이 끝나 선택 목록에 반영될 때까지를 전환으로 묶어,
   * 그동안 확인 중인 카드와 잠시 멈춘 카드를 구분해 보여주고 '추가'는 끝난 뒤에 실행한다.
   */
  const [resolving, startResolve] = useTransition();
  const [addQueued, setAddQueued] = useState(false);
  const resolvingKey = resolving && resolve.variables ? `kakao:${resolve.variables.providerPlaceId}` : null;

  useEffect(() => {
    if (!addQueued || resolving) return;
    setAddQueued(false);
    if (selectionError) return;
    if (selectedPlaces.size > 0) setSelectionError(onAdd([...selectedPlaces.values()]));
  }, [addQueued, onAdd, resolving, selectedPlaces, selectionError]);

  const savedByProviderId = new Map(
    savedPlaces
      .filter((place) => place.provider === "kakao" && place.region_name)
      .map((place) => [place.provider_place_id, place]),
  );
  const inRegion = (place: PlaceOption) =>
    regions.some((region) => place.region_code.slice(0, 5) === region.code.slice(0, 5));
  const selectableSavedPlaces = savedPlaces
    .filter((place) => place.region_name)
    .toSorted((a, b) => Number(inRegion(b)) - Number(inRegion(a)));
  const isSavedPlaceAdded = (place: PlaceOption) =>
    selectedKeys.has(`existing:${place.id}`) ||
    (place.provider === "kakao" && selectedKeys.has(`kakao:${place.provider_place_id}`));
  const toggleSavedPlace = (place: PlaceOption) => {
    const key = `existing:${place.id}`;
    if (!place.region_name || isSavedPlaceAdded(place) || resolving) return;
    setSelectionError(undefined);
    setSelectedPlaces((current) => {
      const next = new Map(current);
      if (next.has(key)) next.delete(key);
      else if (next.size < maxSelectionCount) next.set(key, toExistingRecordLocationPlace(place));
      return next;
    });
  };

  const selectPlace = (place: KakaoPlace, searched: PlaceSearchResult) => {
    setSelectionError(undefined);
    const saved = savedByProviderId.get(place.id);
    if (saved) {
      toggleSavedPlace(saved);
      return;
    }
    const key = `kakao:${place.id}`;
    if (selectedKeys.has(key) || resolving) return;

    if (optimisticSelectedKeys.has(key)) {
      setSelectedPlaces((current) => {
        const next = new Map(current);
        next.delete(key);
        return next;
      });
      return;
    }

    if (optimisticSelectedKeys.size >= maxSelectionCount) return;

    setSelectionError(undefined);
    startResolve(async () => {
      selectOptimistically(key);

      try {
        const result = await resolve.mutateAsync({
          page: searched.page,
          providerPlaceId: place.id,
          query: searched.query,
          scope: searched.scope,
        });
        if ("error" in result) {
          setSelectionError(result.error);
          return;
        }

        setSelectedPlaces((current) => {
          if (current.size >= maxSelectionCount || selectedKeys.has(result.place.key)) return current;
          const next = new Map(current);
          next.set(result.place.key, result.place);
          return next;
        });
      } catch {
        setSelectionError("장소를 확인하지 못했어요.\n잠시 후 다시 시도해 주세요.");
      }
    });
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

  return (
    <>
      <BottomSheet.Header>
        <BottomSheet.Title className="text-left font-bold text-xl">장소 추가</BottomSheet.Title>
        <BottomSheet.Description className="text-left">
          기록에 추가할 장소를 최대 {maxSelectionCount}곳까지 선택하세요.
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
          aria-label="장소 찾기 범위"
          name="place-picker-tab"
          onValueChange={(tab) => {
            if (tab !== "search" && tab !== "saved") return;
            setSelectionError(undefined);
            updateDraft({ tab });
          }}
          value={tab}
        >
          <SegmentedControlItem disabled={resolving || addQueued} value="search">
            검색
          </SegmentedControlItem>
          <SegmentedControlItem disabled={resolving || addQueued} value="saved">
            저장한 장소
          </SegmentedControlItem>
        </SegmentedControl>
        {tab === "saved" ? (
          <>
            {selectableSavedPlaces.length ? (
              <ul
                aria-label="저장한 장소"
                className="grid min-h-0 min-w-0 flex-1 grid-cols-4 content-start items-start gap-x-2.5 gap-y-4 overflow-y-auto overflow-x-hidden overscroll-contain p-1 pb-(--picker-bottom-space)"
              >
                {selectableSavedPlaces.map((place) => {
                  const added = isSavedPlaceAdded(place);
                  const selected = optimisticSelectedKeys.has(`existing:${place.id}`);
                  const selectionLimitReached = optimisticSelectedKeys.size >= maxSelectionCount && !selected;
                  return (
                    <SelectablePlaceGridItem
                      added={added}
                      disabled={added || resolving || selectionLimitReached}
                      key={place.id}
                      onSelect={() => toggleSavedPlace(place)}
                      place={place}
                      selected={selected}
                    />
                  );
                })}
              </ul>
            ) : (
              <p className="py-8 text-center text-muted-foreground text-sm">선택할 수 있는 저장한 장소가 없어요.</p>
            )}
          </>
        ) : (
          <>
            {regions.length || searchRegionName ? (
              <ul aria-label="검색 기준 지역" className="flex flex-wrap gap-1.5">
                {[
                  ...regions.map((region) => ({ code: region.code, label: `${region.label} 주변` })),
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

            {search.data && searchResults.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground text-sm">검색 결과가 없어요.</p>
            ) : null}

            {searchResults.length ? (
              <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain p-1 pb-(--picker-bottom-space)">
                <ul className="flex flex-col gap-2">
                  {searchResults.map(({ page, place }) => {
                    const saved = savedByProviderId.get(place.id);
                    const key = saved ? `existing:${saved.id}` : `kakao:${place.id}`;
                    const added = saved ? isSavedPlaceAdded(saved) : selectedKeys.has(key);
                    const selected = optimisticSelectedKeys.has(key);
                    const selectionLimitReached = optimisticSelectedKeys.size >= maxSelectionCount && !selected;
                    const disabled = added || resolving || selectionLimitReached;

                    return (
                      <SelectablePlaceCard
                        added={added}
                        address={place.address ?? "주소 정보 없음"}
                        checkboxDisabled={selectionLimitReached}
                        disabled={disabled}
                        key={place.id}
                        name={place.name}
                        onSelect={() => selectPlace(place, page)}
                        resolving={key === resolvingKey}
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
          선택한 장소 {optimisticSelectedKeys.size}곳
        </span>
        {showFloatingButton ? (
          <LiquidGlassButton
            aria-busy={addQueued || undefined}
            aria-label={
              optimisticSelectedKeys.size > 0 ? `${optimisticSelectedKeys.size}곳 추가` : "장소를 선택해 주세요"
            }
            className="h-12 min-w-0 border border-border/50 bg-foreground! px-5 text-background text-sm [&_svg]:size-5"
            disabled={optimisticSelectedKeys.size === 0 || addQueued}
            onClick={() => {
              if (resolving) {
                setAddQueued(true);
                return;
              }
              setSelectionError(onAdd([...selectedPlaces.values()]));
            }}
            title={optimisticSelectedKeys.size > 0 ? `${optimisticSelectedKeys.size}곳 추가` : "장소를 선택해 주세요"}
            shape="pill"
            type="button"
          >
            {addQueued ? (
              <Spinner aria-hidden="true" />
            ) : (
              <CheckIcon
                aria-hidden="true"
                className="stroke-current [stroke-linejoin:round] [stroke-width:8]"
                weight="bold"
              />
            )}
            <span>{optimisticSelectedKeys.size}곳 추가</span>
          </LiquidGlassButton>
        ) : null}
      </div>
    </>
  );
}
