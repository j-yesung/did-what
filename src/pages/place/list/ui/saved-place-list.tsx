"use client";

import { useState } from "react";

import { NotepadIcon } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import {
  getPlaceRegionLabel,
  placeQueryKey,
  placeRecordsQueryOptions,
  placesQueryOptions,
  type SavedPlaceRow,
} from "@/entities/place";
import { useLongPress } from "@/shared/lib/use-long-press";
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
    <div className="py-1">
      <ListRow
        className="px-3 py-2.5"
        aria-label={`${place.name} 상세 보기`}
        nativeButton={false}
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
        <ListRowTexts
          className="[&>span:first-child]:font-bold [&>span:first-child]:text-base"
          description={
            <span className="flex items-center justify-between gap-2">
              <span className="truncate">{regionLabel}</span>
              {recordCount > 0 ? (
                <span className="inline-flex shrink-0 items-center gap-0.5 tabular-nums">
                  <NotepadIcon className="size-4" aria-hidden="true" />
                  <span className="sr-only">기록</span>
                  {recordCount}
                </span>
              ) : null}
            </span>
          }
          title={place.name}
        />
      </ListRow>
    </div>
  );
}

export function SavedPlaceList({ initialPlaces }: { initialPlaces: SavedPlaceRow[] }) {
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

  if (placesQuery.isError) {
    return (
      <LoadErrorAlert
        onRetry={() => void placesQuery.refetch()}
        retrying={placesQuery.isFetching}
        title="저장한 장소를 불러오지 못했어요"
      />
    );
  }

  const places = placesQuery.data;

  if (places.length === 0) {
    return (
      <Empty className="flex-none border-0 py-10">
        <EmptyHeader className="gap-1">
          <EmptyTitle className="font-semibold text-base">저장한 장소가 없어요</EmptyTitle>
          <EmptyDescription className="text-sm/normal">장소를 검색해 저장해 보세요.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <section aria-label={`저장한 장소 ${places.length}곳`} className="flex flex-col gap-2">
      <h2 className="px-1 font-semibold text-muted-foreground text-sm">저장한 장소 {places.length}</h2>
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
      <PlaceActionSheet onOpenChange={setActionOpen} open={actionOpen} place={actionTarget} />
    </section>
  );
}
