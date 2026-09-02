"use client";

import { useMemo } from "react";

import { MapPinAreaIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";

import { recordsQueryOptions } from "@/entities/record";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty";
import { PageShell } from "@/shared/ui/layouts";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { Spinner } from "@/shared/ui/spinner";
import { RegionActivityMap } from "@/widgets/region-activity-map";

export function HomePage() {
  const recordsQuery = useQuery(recordsQueryOptions);
  const records = useMemo(
    () =>
      (recordsQuery.data ?? []).map(({ id, region_latitude: latitude, region_longitude: longitude }) => ({
        id,
        latitude,
        longitude,
      })),
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
