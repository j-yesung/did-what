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
import { NotePencilRoundedIcon } from "@/shared/assets/icons/note-pencil-rounded";
import { formatDate } from "@/shared/lib/date/format-date";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { PageHeader, PageShell } from "@/shared/ui/layouts";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { OverscrollBack } from "@/shared/ui/overscroll-back";
import { PressLink } from "@/shared/ui/press-link";

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

  return (
    <OverscrollBack fallbackHref="/places">
      <PageShell>
        <PageHeader back="/places" />

        {isPlacePending ? null : placeQuery.isError || recordsQuery.isError || !place ? (
          <LoadErrorAlert
            icon={<MapPinIcon aria-hidden="true" />}
            onRetry={
              placeQuery.isError || recordsQuery.isError
                ? () => {
                    if (placeQuery.isError) void placeQuery.refetch();
                    if (recordsQuery.isError) void recordsQuery.refetch();
                  }
                : undefined
            }
            retrying={placeQuery.isFetching || recordsQuery.isFetching}
            title="장소의 기록을 불러오지 못했어요"
          />
        ) : (
          <>
            <section aria-labelledby="place-title" className="px-1 py-2">
              <h1 className="text-balance font-bold text-2xl tracking-[-0.035em]" id="place-title">
                {place.name}
              </h1>
              <p className="mt-1 text-muted-foreground text-sm">{place.address ?? "주소 정보 없음"}</p>
              <p className="mt-2 text-muted-foreground text-xs">
                {place.saved_at ? `${formatDate(place.saved_at)}에 저장했어요.` : "방문 기록에 연결된 장소예요."}
              </p>
              <Button
                className="mt-5"
                fullWidth
                nativeButton={false}
                render={<PressLink href={`/records/new?placeId=${place.id}`} />}
                size="xlarge"
              >
                <NotePencilRoundedIcon aria-hidden="true" className="size-6" data-icon="inline-start" />
                이곳에서 기록하기
              </Button>
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
                        <p className={cn("px-1 pb-2 font-bold text-lg tracking-tight", index > 0 && "mt-6")}>
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
