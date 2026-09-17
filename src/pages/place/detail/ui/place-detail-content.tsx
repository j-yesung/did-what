"use client";

import { Fragment } from "react";

import { MapPinIcon } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { placeQueryOptions, placeRecordsQueryOptions, placesQueryOptions } from "@/entities/place";
import {
  EmptyRecords,
  formatRecordTimelineMonth,
  getRecordTimelineItemState,
  RecordCard,
  RecordTimeline,
} from "@/entities/record";
import { recordCommentListQueryOptions } from "@/entities/record-comment";
import { DeletePlaceButton } from "@/features/place/delete-place/ui/delete-place-button";
import { formatDate } from "@/shared/lib/date/format-date";
import { cn } from "@/shared/lib/utils";
import { PageHeader, PageShell } from "@/shared/ui/layouts";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { OverscrollBack } from "@/shared/ui/overscroll-back";

type PlaceDetailContentProps = {
  placeId: string;
};

export function PlaceDetailContent({ placeId }: PlaceDetailContentProps) {
  const queryClient = useQueryClient();
  const placesQuery = useQuery(placesQueryOptions);
  const prefetchComments = (recordId: string) =>
    void queryClient.prefetchInfiniteQuery(recordCommentListQueryOptions(recordId));
  const cachedPlace = placesQuery.data?.find(({ id }) => id === placeId);
  const placeQuery = useQuery({
    ...placeQueryOptions(placeId),
    enabled: !cachedPlace && !placesQuery.isPending,
  });
  const place = cachedPlace ?? placeQuery.data;
  const recordsQuery = useQuery(placeRecordsQueryOptions(placeId));
  const records = (recordsQuery.data ?? [])
    .map(({ record }) => record)
    .toSorted((a, b) => b.recorded_at.localeCompare(a.recorded_at));
  const isPlacePending = !place && !placeQuery.isError && (placesQuery.isPending || placeQuery.isPending);
  const cachedRecordCount = cachedPlace?.record_places[0]?.count ?? 0;
  const recordCount = recordsQuery.data ? records.length : cachedRecordCount;

  return (
    <OverscrollBack fallbackHref="/places">
      <PageShell>
        <PageHeader back="/places" title="기억의 장소" />

        {isPlacePending ? null : placeQuery.isError || recordsQuery.isError || !place ? (
          <LoadErrorAlert
            icon={<MapPinIcon strokeWidth={2} aria-hidden="true" />}
            title="장소의 기록을 불러오지 못했어요"
          />
        ) : (
          <>
            <section aria-labelledby="place-title" className="px-1 py-2">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <h1 className="text-balance font-bold text-2xl tracking-[-0.035em]" id="place-title">
                    {place.name}
                  </h1>
                  <p className="mt-1 text-muted-foreground text-sm">{place.address ?? "주소 정보 없음"}</p>
                  <p className="mt-2 text-muted-foreground text-xs">
                    {place.saved_at ? `${formatDate(place.saved_at)}에 저장했어요.` : "방문 기록에 연결된 장소예요."}
                  </p>
                </div>
                <DeletePlaceButton name={place.name} placeId={place.id} recordCount={recordCount} />
              </div>
            </section>

            {recordsQuery.isPending ? null : records.length ? (
              <RecordTimeline aria-labelledby="place-records-title" className="gap-0">
                <div className="mb-2 flex items-center justify-between gap-3 px-1">
                  <h2 className="font-semibold text-base" id="place-records-title">
                    이곳의 기록
                  </h2>
                  <p className="text-muted-foreground text-xs">{records.length}개</p>
                </div>

                {records.map((record, index) => {
                  const { startsDate, startsMonth } = getRecordTimelineItemState(records, index);

                  return (
                    <Fragment key={record.id}>
                      {startsMonth ? (
                        <p className={cn("px-1 pb-2 font-bold text-lg tracking-[-0.025em]", index > 0 && "mt-6")}>
                          {formatRecordTimelineMonth(record.recorded_at)}
                        </p>
                      ) : null}
                      <RecordCard
                        isLast={index === records.length - 1}
                        onDetailPrefetch={prefetchComments}
                        record={record}
                        startsDate={startsDate}
                      />
                    </Fragment>
                  );
                })}
              </RecordTimeline>
            ) : (
              <EmptyRecords title={`${place.name}에서 남긴 기록이 없어요`} />
            )}
          </>
        )}
      </PageShell>
    </OverscrollBack>
  );
}
