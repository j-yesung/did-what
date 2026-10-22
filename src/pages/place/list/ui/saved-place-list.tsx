"use client";

import { useState } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import {
  getPlaceRegionLabel,
  PlaceGridItemContent,
  placeQueryKey,
  placeRecordsQueryOptions,
  placesQueryOptions,
  type SavedPlaceRow,
} from "@/entities/place";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { buttonVariants } from "@/shared/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/shared/ui/empty";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { PressLink } from "@/shared/ui/press-link";
import { SearchField } from "@/shared/ui/search-field";

import { PlaceSearchBottomSheet } from "./place-search-bottom-sheet";

type SavedPlaceListItemProps = {
  onDetailPrefetch: (place: SavedPlaceRow) => void;
  place: SavedPlaceRow;
};

function SavedPlaceListItem({ onDetailPrefetch, place }: SavedPlaceListItemProps) {
  const queryClient = useQueryClient();
  const href = `/places/${place.id}`;
  const cachePlace = () => queryClient.setQueryData(placeQueryKey(place.id), place);
  const recordCount = place.record_places[0]?.count ?? 0;
  const regionLabel = getPlaceRegionLabel(place.region_name, place.address);

  return (
    <li className="min-w-0">
      <PressLink
        className={cn(
          buttonVariants({ fullWidth: true, variant: "ghost" }),
          "h-auto min-w-0 flex-col gap-1.5 whitespace-normal rounded-2xl p-0 after:hidden",
        )}
        aria-label={`${place.name}, ${regionLabel}, 기록 ${recordCount}개 상세 보기`}
        href={href}
        onClick={cachePlace}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          onDetailPrefetch(place);
        }}
        prefetch={false}
      >
        <PlaceGridItemContent
          badge={
            recordCount > 0 ? (
              <Badge className="absolute top-1.5 right-1.5 h-4.5 min-w-4.5 rounded-md bg-surface/80 px-1 py-0 text-[10px] tabular-nums leading-none">
                {recordCount}
              </Badge>
            ) : null
          }
          place={place}
        />
      </PressLink>
    </li>
  );
}

export function SavedPlaceList({
  initialPlaces,
  initialSearchQuery,
}: {
  initialPlaces: SavedPlaceRow[];
  initialSearchQuery?: string;
}) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const queryClient = useQueryClient();
  const placesQuery = useQuery({ ...placesQueryOptions, initialData: initialPlaces });

  const prefetchDetail = (place: SavedPlaceRow) => {
    queryClient.setQueryData(placeQueryKey(place.id), place);
    const href = `/places/${place.id}`;
    router.prefetch(href);
    void queryClient.prefetchQuery(placeRecordsQueryOptions(place.id));
  };

  const places = placesQuery.data;
  const normalizedQuery = query.trim().toLocaleLowerCase("ko-KR");
  const visiblePlaces = places.filter((place) =>
    [place.name, place.address, place.region_name].some((value) =>
      value?.toLocaleLowerCase("ko-KR").includes(normalizedQuery),
    ),
  );

  return (
    <>
      <SearchField
        aria-label="저장한 장소 검색"
        maxLength={100}
        onValueChange={setQuery}
        placeholder="저장한 장소 이름 또는 주소"
        value={query}
      />
      <div className="flex min-h-11 items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs">저장한 장소 {places.length}곳</p>
        <PlaceSearchBottomSheet initialPlaces={initialPlaces} initialQuery={initialSearchQuery} />
      </div>
      {placesQuery.isError ? (
        <LoadErrorAlert
          onRetry={() => void placesQuery.refetch()}
          retrying={placesQuery.isFetching}
          title="저장한 장소를 불러오지 못했어요"
        />
      ) : visiblePlaces.length === 0 ? (
        <Empty className="flex-1 py-10">
          <EmptyHeader>
            <EmptyTitle className="font-semibold text-base">
              {query.trim() ? "검색 결과가 없어요" : "저장한 장소가 없어요"}
            </EmptyTitle>
            <EmptyDescription className="text-sm/normal">
              {query.trim() ? "장소 이름이나 주소를 바꿔 보세요." : "새 장소를 찾아 저장해 보세요."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <section aria-label={`저장한 장소 ${visiblePlaces.length}곳`} className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-base">저장한 장소</h2>
            <span className="text-muted-foreground text-xs">최근 저장순</span>
          </div>
          <ul className="grid grid-cols-4 items-start gap-x-2.5 gap-y-4">
            {visiblePlaces.map((place) => (
              <SavedPlaceListItem key={place.id} onDetailPrefetch={prefetchDetail} place={place} />
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
