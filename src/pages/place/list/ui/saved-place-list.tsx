"use client";

import { MapPinIcon } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getPlaceRegionLabel,
  placeQueryKey,
  placeRecordsQueryOptions,
  placesQueryOptions,
  type SavedPlaceRow,
} from "@/entities/place";
import { Badge } from "@/shared/ui/badge";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty";
import { ListRow, ListRowTexts } from "@/shared/ui/list-row";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { PressLink } from "@/shared/ui/press-link";

export function SavedPlaceList({ initialPlaces }: { initialPlaces: SavedPlaceRow[] }) {
  const queryClient = useQueryClient();
  const placesQuery = useQuery({ ...placesQueryOptions, initialData: initialPlaces });

  if (placesQuery.isError) {
    return <LoadErrorAlert title="저장한 장소를 불러오지 못했어요" />;
  }

  const places = placesQuery.data;

  if (places.length === 0) {
    return (
      <Empty className="border bg-card py-12">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MapPinIcon strokeWidth={2} aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>아직 저장한 장소가 없어요</EmptyTitle>
          <EmptyDescription>위 검색란에서 첫 번째 추억의 장소를 찾아 저장해 보세요.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <section aria-label={`저장한 장소 ${places.length}곳`} className="flex flex-col gap-3">
      <div className="px-1">
        <h2 className="mt-1 font-bold text-lg">저장한 장소</h2>
      </div>
      <div className="flex flex-col gap-2.5 overflow-hidden">
        {places.map((place) => {
          const href = `/places/${place.id}`;

          return (
            <ListRow
              key={place.id}
              aria-label={`${place.name} 상세 보기`}
              nativeButton={false}
              render={
                <PressLink
                  href={href}
                  onClick={() => {
                    queryClient.setQueryData(placeQueryKey(place.id), place);
                  }}
                  onPointerDown={(event) => {
                    if (event.button === 0) void queryClient.prefetchQuery(placeRecordsQueryOptions(place.id));
                  }}
                  prefetch
                />
              }
              right={
                (place.record_places[0]?.count ?? 0) > 0 ? (
                  <Badge
                    aria-label={`기록 ${place.record_places[0]?.count}개`}
                    className="min-h-6 min-w-6 justify-center rounded-full bg-primary px-1.5 py-1 text-primary-foreground text-xs"
                    tone="primary"
                  >
                    {place.record_places[0]?.count}
                  </Badge>
                ) : null
              }
            >
              <ListRowTexts
                description={`${getPlaceRegionLabel(place.region_name, place.address)}`}
                title={place.name}
              />
            </ListRow>
          );
        })}
      </div>
    </section>
  );
}
