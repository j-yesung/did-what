"use client";

import { type ReactNode, useState } from "react";

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
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { buttonVariants } from "@/shared/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/shared/ui/empty";
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
    <li className="min-w-0">
      <PressLink
        {...longPress}
        className={cn(
          buttonVariants({ fullWidth: true, variant: "ghost" }),
          "h-auto min-w-0 flex-col gap-1.5 whitespace-normal rounded-2xl p-0 after:hidden",
        )}
        aria-label={`${place.name}, ${regionLabel}, 기록 ${recordCount}개 상세 보기`}
        href={href}
        onClick={cachePlace}
        onPointerDown={(event) => {
          longPress.onPointerDown?.(event);
          if (event.button !== 0) return;
          onDetailPrefetch(place);
        }}
        prefetch={false}
      >
        <span aria-hidden="true" className="relative block w-[84%]">
          <PlaceIconTile className="aspect-square size-auto w-full rounded-2xl [&_svg]:size-6.5" place={place} />
          {recordCount > 0 ? (
            <Badge className="absolute top-1.5 right-1.5 h-4.5 min-w-4.5 rounded-md bg-surface/80 px-1 py-0 text-[10px] tabular-nums leading-none">
              {recordCount}
            </Badge>
          ) : null}
        </span>
        <span className="flex w-full min-w-0 flex-col gap-0.5 text-center">
          <span className="line-clamp-2 font-semibold text-[11px] leading-3.5">{place.name}</span>
          <span className="w-full truncate text-[10px] text-muted-foreground leading-3">{regionLabel}</span>
        </span>
      </PressLink>
    </li>
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
        <Empty className="flex-1 border-0 py-10">
          <EmptyHeader className="gap-1">
            <EmptyTitle className="font-semibold text-base">저장한 장소가 없어요</EmptyTitle>
            <EmptyDescription className="text-sm/normal">장소를 검색해 저장해 보세요.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <section aria-label={`저장한 장소 ${places.length}곳`} className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-base">저장한 장소</h2>
            <span className="text-muted-foreground text-xs">최근 저장순</span>
          </div>
          <ul className="grid grid-cols-4 items-start gap-x-2.5 gap-y-4">
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
          </ul>
        </section>
      )}
      <PlaceActionSheet onOpenChange={setActionOpen} open={actionOpen} place={actionTarget} />
    </>
  );
}
