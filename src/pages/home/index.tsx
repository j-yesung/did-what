"use client";

import { useMemo } from "react";

import { MapPinAreaIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";

import { recordLocationsQueryOptions } from "@/entities/record";
import { getRegionCode } from "@/entities/region";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty";
import { PageShell } from "@/shared/ui/layouts";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { Spinner } from "@/shared/ui/spinner";
import { RegionActivityMap } from "@/widgets/region-activity-map";

export function HomePage() {
  const recordsQuery = useQuery(recordLocationsQueryOptions);
  const records = useMemo(
    () =>
      (recordsQuery.data ?? []).map(({ id, region_latitude: latitude, region_longitude: longitude }) => ({
        id,
        latitude,
        longitude,
      })),
    [recordsQuery.data],
  );
  const visitedRegionCount = useMemo(
    () => new Set((recordsQuery.data ?? []).map(({ region_code }) => getRegionCode(region_code)).filter(Boolean)).size,
    [recordsQuery.data],
  );

  if (recordsQuery.isPending) {
    return (
      <PageShell className="items-center justify-center pb-[calc(var(--nav-clearance)+50px)]" withBottomNavigation>
        <Spinner aria-label="발자취를 불러오는 중" className="text-muted-foreground" />
      </PageShell>
    );
  }

  return (
    <PageShell className="pb-[calc(var(--nav-clearance)+50px)]" withBottomNavigation>
      <section className="grid min-h-0 flex-1 place-items-center px-1.5 py-1" aria-label="대한민국 활동 지도">
        <RegionActivityMap records={records} />
      </section>

      {records.length > 0 ? (
        <section className="flex items-center justify-between gap-4 px-1 text-xs" aria-label="지도 범례">
          <p className="text-muted-foreground">
            <strong className="font-bold text-foreground">방문 지역 {visitedRegionCount}곳</strong>
            <span aria-hidden="true"> · </span>
            기록 {records.length}개
          </p>
          <div className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
            <span>적게</span>
            <span className="flex gap-1" aria-hidden="true">
              <span className="size-2.5 rounded-xs bg-map-level-1" />
              <span className="size-2.5 rounded-xs bg-map-level-2" />
              <span className="size-2.5 rounded-xs bg-map-level-3" />
              <span className="size-2.5 rounded-xs bg-map-level-4" />
            </span>
            <span>많이</span>
          </div>
        </section>
      ) : null}

      {recordsQuery.isError ? (
        <LoadErrorAlert
          icon={<MapPinAreaIcon strokeWidth={2} aria-hidden="true" />}
          title="발자취를 불러오지 못했어요"
        />
      ) : records.length > 0 ? null : (
        <Empty className="flex-none py-4">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MapPinAreaIcon strokeWidth={2} aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>아직 지도에 남긴 발자취가 없어요</EmptyTitle>
            <EmptyDescription>함께한 오늘의 지역을 첫 발자취로 남겨보세요.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </PageShell>
  );
}
