"use client";

import { useMemo } from "react";

import { MapTrifoldIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { type RecordLocationRow, recordLocationsQueryOptions } from "@/entities/record";
import { createRegionActivityMaps, getRegionProgressLabel, RegionMiniMap } from "@/entities/region";
import { Button } from "@/shared/ui/button";
import { PageHeader, PageShell } from "@/shared/ui/layouts";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";

export function RegionsContent({ initialRecords }: { initialRecords: RecordLocationRow[] }) {
  const recordsQuery = useQuery({ ...recordLocationsQueryOptions, initialData: initialRecords });
  const recordLocations = useMemo(
    () =>
      recordsQuery.data.map(
        ({ id, region_code: administrativeCode, region_latitude: latitude, region_longitude: longitude }) => ({
          administrativeCode,
          id,
          latitude,
          longitude,
        }),
      ),
    [recordsQuery.data],
  );
  const regionMaps = useMemo(() => createRegionActivityMaps(recordLocations), [recordLocations]);

  return (
    <PageShell className="pb-[calc(var(--nav-clearance)+50px)]" withBottomNavigation>
      <PageHeader title="지역" />

      <div className="px-1">
        <h2 className="font-bold text-lg tracking-tight">함께한 지역을 한눈에 돌아보세요.</h2>
      </div>

      {recordsQuery.isError ? (
        <LoadErrorAlert
          icon={<MapTrifoldIcon strokeWidth={2} aria-hidden="true" />}
          title="지역별 발자취를 불러오지 못했어요"
        />
      ) : (
        <ul className="-mx-1 grid grid-cols-2 gap-x-2 gap-y-1" aria-label="시·도별 발자취">
          {regionMaps.map((map) => (
            <li key={map.code}>
              <Button
                aria-label={`${map.name}, ${map.totalCount}곳 중 ${map.visitedCount}곳 방문`}
                className="h-auto min-h-22 justify-start gap-2 rounded-2xl px-2 py-2.5 text-left after:hidden [&>span]:w-full"
                fullWidth
                nativeButton={false}
                render={<Link href={`/regions/${map.code}`} prefetch />}
                variant="ghost"
              >
                <span className="grid size-11 shrink-0 place-items-center p-0.5">
                  <RegionMiniMap map={map} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block break-keep font-bold text-[13px] leading-[1.35] tracking-[-0.02em]">
                    {map.name}
                  </span>
                  <span className="mt-1.5 block text-[11px] text-muted-foreground leading-[1.35]">
                    {getRegionProgressLabel(map)}
                  </span>
                </span>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
