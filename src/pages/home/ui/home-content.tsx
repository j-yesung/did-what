"use client";

import { MapPinAreaIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";

import { recordLocationsQueryOptions } from "@/entities/record";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { RegionActivityMap } from "@/widgets/region-activity-map/ui/region-activity-map";

const EMPTY_RECORDS: [] = [];

export function HomeContent({ member }: { member: { id: string; name: string } }) {
  const recordsQuery = useQuery(recordLocationsQueryOptions);
  const records = recordsQuery.data ?? EMPTY_RECORDS;

  return (
    <>
      <section
        className="relative -mx-5 -mt-[calc(var(--page-top)+var(--toolbar-height)+var(--page-gap))] -mb-(--nav-clearance) min-h-0 flex-1"
        aria-label="대한민국 활동 지도"
        aria-busy={recordsQuery.isPending}
        data-screen="map"
      >
        <RegionActivityMap member={member} records={records} />
      </section>

      {recordsQuery.isError ? (
        <LoadErrorAlert
          icon={<MapPinAreaIcon aria-hidden="true" />}
          onRetry={() => void recordsQuery.refetch()}
          retrying={recordsQuery.isFetching}
          title="발자취를 불러오지 못했어요"
        />
      ) : null}
    </>
  );
}
