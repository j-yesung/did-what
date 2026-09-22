"use client";

import { Fragment, useMemo } from "react";

import { MapTrifoldIcon, NotePencilIcon } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  EmptyRecords,
  formatRecordTimelineMonth,
  getRecordTimelineItemState,
  RecordCard,
  RecordTimeline,
  recordLocationsQueryOptions,
  regionRecordsQueryOptions,
  toRegionLocations,
} from "@/entities/record";
import { recordCommentListQueryOptions } from "@/entities/record-comment";
import { createRegionActivityMaps, type Region, RegionMiniMap } from "@/entities/region";
import { cn } from "@/shared/lib/utils";
import { PageHeader, PageShell } from "@/shared/ui/layouts";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { OverscrollBack } from "@/shared/ui/overscroll-back";

type RegionDetailContentProps = {
  region: Region;
};

export function RegionDetailContent({ region }: RegionDetailContentProps) {
  const queryClient = useQueryClient();
  const locationsQuery = useQuery(recordLocationsQueryOptions);
  const prefetchComments = (recordId: string) =>
    void queryClient.prefetchInfiniteQuery(recordCommentListQueryOptions(recordId));
  const recordsQuery = useQuery(regionRecordsQueryOptions(region));
  const recordLocations = useMemo(() => toRegionLocations(locationsQuery.data ?? []), [locationsQuery.data]);
  const regionMap = useMemo(
    () => createRegionActivityMaps(recordLocations).find(({ code }) => code === region.code),
    [recordLocations, region.code],
  );
  const records = recordsQuery.data ?? [];

  return (
    <OverscrollBack fallbackHref="/regions">
      <PageShell>
        <PageHeader back="/regions" title={region.name} />

        {recordsQuery.isError || locationsQuery.isError ? (
          <LoadErrorAlert
            icon={<MapTrifoldIcon strokeWidth={2} aria-hidden="true" />}
            onRetry={() => {
              if (recordsQuery.isError) void recordsQuery.refetch();
              if (locationsQuery.isError) void locationsQuery.refetch();
            }}
            retrying={recordsQuery.isFetching || locationsQuery.isFetching}
            title="지역 발자취를 불러오지 못했어요"
          />
        ) : (
          <>
            {regionMap ? (
              <section
                className="grid grid-cols-[112px_1fr] items-center gap-5 px-2 py-3"
                aria-label="지역 발자취 현황"
              >
                <div className="h-30 w-28">
                  <RegionMiniMap
                    label={`${region.name}, ${regionMap.totalCount}곳 중 ${regionMap.visitedCount}곳 방문`}
                    map={regionMap}
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-muted-foreground text-xs">방문한 하위 지역</p>
                  <p className="mt-1 font-bold text-3xl tracking-[-0.045em]">
                    {regionMap.visitedCount}
                    <span className="ml-1 font-medium text-base text-muted-foreground">/ {regionMap.totalCount}</span>
                  </p>
                  <p className="mt-2 text-muted-foreground text-sm">기록이 남은 셀을 색으로 표시해요.</p>
                </div>
              </section>
            ) : null}

            {recordsQuery.isPending ? null : records.length > 0 ? (
              <RecordTimeline aria-labelledby="region-records-title" className="gap-0">
                <div className="mb-2 flex items-center justify-between gap-3 px-1">
                  <h2 className="flex items-center gap-2 font-bold" id="region-records-title">
                    <NotePencilIcon strokeWidth={2} className="size-5 text-foreground" aria-hidden="true" />
                    <span>이 지역의 기록</span>
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
              <EmptyRecords title={`${region.name}에 남긴 기록이 없어요`} />
            )}
          </>
        )}
      </PageShell>
    </OverscrollBack>
  );
}
