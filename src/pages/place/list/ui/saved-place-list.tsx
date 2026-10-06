"use client";

import { type ReactNode, useState } from "react";

import { CaretRightIcon } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import {
  getPlaceRegionLabel,
  PlaceIconTile,
  placeQueryKey,
  placeRecordsQueryOptions,
  placesQueryOptions,
  type SavedPlaceRow,
} from "@/entities/place";
import { useLongPress } from "@/shared/lib/use-long-press";
import { Badge } from "@/shared/ui/badge";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/shared/ui/empty";
import { ListRow, ListRowTexts } from "@/shared/ui/list-row";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { PressLink } from "@/shared/ui/press-link";

import { PlaceActionSheet } from "./place-action-sheet";

type SavedPlaceListItemProps = {
  onDetailPrefetch: (place: SavedPlaceRow) => void;
  onLongPress: () => void;
  place: SavedPlaceRow;
};

function SavedPlaceListItem({ onDetailPrefetch, onLongPress, place }: SavedPlaceListItemProps) {
  const longPress = useLongPress(onLongPress);
  const queryClient = useQueryClient();
  const href = `/places/${place.id}`;
  const cachePlace = () => queryClient.setQueryData(placeQueryKey(place.id), place);
  const recordCount = place.record_places[0]?.count ?? 0;
  const regionLabel = getPlaceRegionLabel(place.region_name, place.address);

  return (
    <div>
      <ListRow
        className="px-0 py-4"
        aria-label={`${place.name} 상세 보기`}
        nativeButton={false}
        right={<CaretRightIcon aria-hidden="true" className="size-4 text-muted-foreground" />}
        render={
          <PressLink
            {...longPress}
            href={href}
            onClick={cachePlace}
            onPointerDown={(event) => {
              longPress.onPointerDown?.(event);
              if (event.button !== 0) return;
              onDetailPrefetch(place);
            }}
            prefetch={false}
          />
        }
      >
        <span className="flex min-w-0 items-center gap-3">
          <PlaceIconTile className="size-12.5" place={place} />
          <ListRowTexts
            className="min-w-0 flex-1 gap-1 [&>span:first-child]:font-bold [&>span:first-child]:text-base"
            description={
              <span className="flex min-w-0 items-center justify-between gap-2 text-[11px]">
                <span className="min-w-0 truncate">{regionLabel}</span>
                {recordCount > 0 ? (
                  <Badge className="rounded-lg px-2 py-1 text-[10px]" tone="primary">
                    기록 {recordCount}
                  </Badge>
                ) : null}
              </span>
            }
            title={place.name}
          />
        </span>
      </ListRow>
    </div>
  );
}

export function SavedPlaceList({
  initialPlaces,
  searchForm,
}: {
  initialPlaces: SavedPlaceRow[];
  searchForm: ReactNode;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const placesQuery = useQuery({ ...placesQueryOptions, initialData: initialPlaces });
  const [actionTarget, setActionTarget] = useState<SavedPlaceRow | null>(null);
  const [actionOpen, setActionOpen] = useState(false);

  const prefetchDetail = (place: SavedPlaceRow) => {
    queryClient.setQueryData(placeQueryKey(place.id), place);
    const href = `/places/${place.id}`;
    router.prefetch(href);
    void queryClient.prefetchQuery(placeRecordsQueryOptions(place.id));
  };

  const places = placesQuery.data;
  const visitedPlaceCount = places.filter((place) => (place.record_places[0]?.count ?? 0) > 0).length;

  return (
    <>
      {!placesQuery.isError ? (
        <dl aria-label="장소 요약" className="flex gap-8 py-2">
          <div className="flex flex-col-reverse gap-1">
            <dt className="text-muted-foreground text-xs">저장한 장소</dt>
            <dd className="font-bold text-3xl tabular-nums tracking-tight">{places.length}</dd>
          </div>
          <div className="flex flex-col-reverse gap-1">
            <dt className="text-muted-foreground text-xs">기록을 남긴 장소</dt>
            <dd className="font-bold text-3xl tabular-nums tracking-tight">{visitedPlaceCount}</dd>
          </div>
        </dl>
      ) : null}
      {searchForm}
      {placesQuery.isError ? (
        <LoadErrorAlert
          onRetry={() => void placesQuery.refetch()}
          retrying={placesQuery.isFetching}
          title="저장한 장소를 불러오지 못했어요"
        />
      ) : places.length === 0 ? (
        <Empty className="flex-none border-0 py-10">
          <EmptyHeader className="gap-1">
            <EmptyTitle className="font-semibold text-base">저장한 장소가 없어요</EmptyTitle>
            <EmptyDescription className="text-sm/normal">장소를 검색해 저장해 보세요.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <section aria-label={`저장한 장소 ${places.length}곳`} className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-base">저장한 장소</h2>
            <span className="text-muted-foreground text-xs">최근 저장순</span>
          </div>
          <div className="flex flex-col divide-y overflow-hidden">
            {places.map((place) => (
              <SavedPlaceListItem
                key={place.id}
                onDetailPrefetch={prefetchDetail}
                onLongPress={() => {
                  setActionTarget(place);
                  setActionOpen(true);
                }}
                place={place}
              />
            ))}
          </div>
        </section>
      )}
      <PlaceActionSheet onOpenChange={setActionOpen} open={actionOpen} place={actionTarget} />
    </>
  );
}
