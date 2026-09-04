"use client";

import { useMemo } from "react";

import { MapTrifoldIcon, NotePencilIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";

import {
  EmptyRecords,
  RecordCard,
  RecordTimeline,
  RecordTimelineSkeleton,
  recordLocationsQueryOptions,
  regionRecordsQueryOptions,
} from "@/entities/record";
import { createRegionActivityMaps, type Region, RegionMiniMap } from "@/entities/region";
import { PageHeader, PageShell } from "@/shared/ui/layouts";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { OverscrollBack } from "@/shared/ui/overscroll-back";
import { Skeleton } from "@/shared/ui/skeleton";

type RegionDetailContentProps = {
  region: Region;
};

export function RegionDetailContent({ region }: RegionDetailContentProps) {
  const locationsQuery = useQuery(recordLocationsQueryOptions);
  const recordsQuery = useQuery(regionRecordsQueryOptions(region));
  const recordLocations = useMemo(
    () =>
      (locationsQuery.data ?? []).map(
        ({ id, region_code: administrativeCode, region_latitude: latitude, region_longitude: longitude }) => ({
          administrativeCode,
          id,
          latitude,
          longitude,
        }),
      ),
    [locationsQuery.data],
  );
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
            title="지역 발자취를 불러오지 못했어요"
          />
        ) : locationsQuery.isPending ? (
          <RegionDetailSkeleton />
        ) : !regionMap ? (
          <LoadErrorAlert
            icon={<MapTrifoldIcon strokeWidth={2} aria-hidden="true" />}
            title="지역 발자취를 불러오지 못했어요"
          />
        ) : (
          <>
            <section className="grid grid-cols-[112px_1fr] items-center gap-5 px-2 py-3" aria-label="지역 발자취 현황">
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

            {recordsQuery.isPending ? (
              <RecordTimelineSkeleton label={`${region.name} 기록을 불러오는 중`} />
            ) : records.length > 0 ? (
              <RecordTimeline aria-labelledby="region-records-title">
                <div className="flex items-center justify-between gap-3 px-1">
                  <h2 className="flex items-center gap-2 font-bold" id="region-records-title">
                    <NotePencilIcon strokeWidth={2} className="size-5 text-foreground" aria-hidden="true" />
                    <span>이 지역의 기록</span>
                  </h2>
                  <p className="text-muted-foreground text-xs">{records.length}개</p>
                </div>

                {records.map((record, index) => (
                  <RecordCard isLast={index === records.length - 1} key={record.id} record={record} />
                ))}
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

function RegionDetailSkeleton() {
  return (
    <div aria-label="지역 발자취를 불러오는 중" aria-live="polite" className="flex flex-col gap-5" role="status">
      <section className="grid grid-cols-[112px_1fr] items-center gap-5 px-2 py-3">
        <Skeleton className="h-30 w-28 rounded-xl" />
        <div>
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-2 h-9 w-28" />
          <Skeleton className="mt-2 h-4 w-44" />
        </div>
      </section>
      <RecordTimelineSkeleton />
    </div>
  );
}
