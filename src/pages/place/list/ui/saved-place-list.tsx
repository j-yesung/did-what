"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import {
  getPlaceRegionLabel,
  placeQueryKey,
  placeRecordsQueryOptions,
  placesQueryOptions,
  type SavedPlaceRow,
} from "@/entities/place";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/shared/ui/empty";
import { ListRow, ListRowTexts } from "@/shared/ui/list-row";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { PressLink } from "@/shared/ui/press-link";

export function SavedPlaceList({ initialPlaces }: { initialPlaces: SavedPlaceRow[] }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const placesQuery = useQuery({ ...placesQueryOptions, initialData: initialPlaces });

  if (placesQuery.isError) {
    return <LoadErrorAlert title="저장한 장소를 불러오지 못했어요" />;
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
        {places.map((place) => {
          const href = `/places/${place.id}`;
          const cachePlace = () => queryClient.setQueryData(placeQueryKey(place.id), place);

          return (
            <ListRow
              className="px-1 py-2.5"
              key={place.id}
              aria-label={`${place.name} 상세 보기`}
              nativeButton={false}
              render={
                <PressLink
                  href={href}
                  onClick={cachePlace}
                  onPointerDown={(event) => {
                    if (event.button !== 0) return;
                    cachePlace();
                    router.prefetch(href);
                    void queryClient.prefetchQuery(placeRecordsQueryOptions(place.id));
                  }}
                  prefetch={false}
                />
              }
              right={
                (place.record_places[0]?.count ?? 0) > 0 ? (
                  <span className="text-muted-foreground text-xs">기록 {place.record_places[0]?.count}</span>
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
