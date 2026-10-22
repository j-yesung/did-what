"use client";

import type { SubmitEvent } from "react";

import { WarningCircleIcon } from "@phosphor-icons/react";
import type { InfiniteData, UseInfiniteQueryResult } from "@tanstack/react-query";

import type { PlaceSearchResult } from "@/entities/place";
import { getErrorMessage } from "@/shared/api/http/get-error-message";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { LoadMoreButton } from "@/shared/ui/load-more-button";
import { SearchField } from "@/shared/ui/search-field";

import type { PlacePickerDraft } from "../model/location-picker";
import type { getPlacePickerResults } from "../model/place-picker-results";
import type { usePlacePickerSelection } from "../model/use-place-picker-selection";
import { SelectablePlaceCard } from "./selectable-place-card";

type PlacePickerPlacesProps = {
  draft: Pick<PlacePickerDraft, "keyword" | "selectedPlaces">;
  updateDraft: (patch: Partial<PlacePickerDraft>) => void;
  onSearch: (event: SubmitEvent<HTMLFormElement>) => void;
  search: UseInfiniteQueryResult<InfiniteData<PlaceSearchResult>>;
  results: ReturnType<typeof getPlacePickerResults>;
  scopeCode: string;
  searchRegionName?: string;
  queryTooLong: boolean;
  selectedKeys: Set<string>;
  selection: Pick<
    ReturnType<typeof usePlacePickerSelection>,
    | "addQueued"
    | "isSavedPlaceAdded"
    | "optimisticSelectedKeys"
    | "pendingPlaceKeys"
    | "selectPlace"
    | "setSelectionError"
    | "toggleSavedPlace"
  >;
};

export function PlacePickerPlaces({
  draft,
  updateDraft,
  onSearch,
  search,
  results,
  scopeCode,
  searchRegionName,
  queryTooLong,
  selectedKeys,
  selection,
}: PlacePickerPlacesProps) {
  const { keyword, selectedPlaces } = draft;
  const { savedByProviderId, searchScopes, savedMatches, uniqueSearchResults } = results;
  const {
    addQueued,
    isSavedPlaceAdded,
    optimisticSelectedKeys,
    pendingPlaceKeys,
    selectPlace,
    setSelectionError,
    toggleSavedPlace,
  } = selection;
  return (
    <>
      {searchScopes.length || searchRegionName ? (
        <ul aria-label="검색 기준 지역" className="flex flex-wrap gap-1.5">
          {[
            ...searchScopes.map((region) => ({ code: region.code, label: `${region.label} 주변` })),
            ...(searchRegionName ? [{ code: "map", label: `${searchRegionName} 기준` }] : []),
            { code: "", label: "전국" },
          ].map((region) => (
            <li key={region.code || "nationwide"}>
              <Button
                aria-pressed={region.code === scopeCode}
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

      <form aria-label="방문 장소 검색" onSubmit={onSearch} role="search">
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
  );
}
