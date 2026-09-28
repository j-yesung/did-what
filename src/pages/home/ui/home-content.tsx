"use client";

import { MapPinAreaIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";

import { recordLocationsQueryOptions } from "@/entities/record";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { RegionActivityMap } from "@/widgets/region-activity-map/ui/region-activity-map";

// 불러오는 동안 매 렌더마다 새 빈 배열을 넘기면 지도가 점과 배지를 계속 다시 계산한다.
const EMPTY_RECORDS: [] = [];

export function HomeContent() {
  const recordsQuery = useQuery(recordLocationsQueryOptions);
  const records = recordsQuery.data ?? EMPTY_RECORDS;

  return (
    <>
      <section
        className="relative -mx-5 -mt-[calc(var(--page-top)+var(--toolbar-height)+var(--page-gap))] -mb-(--nav-clearance) min-h-0 flex-1"
        aria-label="대한민국 활동 지도"
        data-screen="map"
      >
        <RegionActivityMap records={records} />
      </section>

      {recordsQuery.isError ? (
        <LoadErrorAlert
          icon={<MapPinAreaIcon aria-hidden="true" />}
          onRetry={() => void recordsQuery.refetch()}
          retrying={recordsQuery.isFetching}
          title="발자취를 불러오지 못했어요"
        />
      ) : records.length > 0 ? null : (
        <Empty className="flex-none py-4">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MapPinAreaIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>아직 지도에 남긴 발자취가 없어요</EmptyTitle>
            <EmptyDescription>함께한 오늘의 지역을 첫 발자취로 남겨보세요.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </>
  );
}
