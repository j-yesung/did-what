"use client";

import { MapPinAreaIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { recordsQueryOptions } from "@/entities/record/api/records-query";
import { Button } from "@/shared/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty";
import { PageShell } from "@/shared/ui/layouts";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { Spinner } from "@/shared/ui/spinner";

import { KoreaActivityMap } from "./korea-activity-map";

export function HomePage() {
  const recordsQuery = useQuery(recordsQueryOptions);
  const records = (recordsQuery.data ?? []).map(({ id, region_latitude: latitude, region_longitude: longitude }) => ({
    id,
    latitude,
    longitude,
  }));

  if (recordsQuery.isPending) {
    return (
      <PageShell className="items-center justify-center" withBottomNavigation>
        <Spinner aria-label="발자취를 불러오는 중" className="text-muted-foreground" />
      </PageShell>
    );
  }

  return (
    <PageShell className="gap-3 pt-3" withBottomNavigation>
      <section className="grid min-h-0 flex-1 place-items-center px-1.5 py-1" aria-label="대한민국 활동 지도">
        <KoreaActivityMap records={records} />
      </section>

      {recordsQuery.isError ? (
        <LoadErrorAlert
          icon={<MapPinAreaIcon strokeWidth={2} aria-hidden="true" />}
          title="발자취를 불러오지 못했어요"
        />
      ) : records.length > 0 ? (
        <p className="text-center text-muted-foreground text-sm">지금까지 남긴 발자취 {records.length}개</p>
      ) : (
        <Empty className="flex-none py-4">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MapPinAreaIcon strokeWidth={2} aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>아직 지도에 남긴 발자취가 없어요</EmptyTitle>
            <EmptyDescription>함께한 오늘의 지역을 첫 발자취로 남겨보세요.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button render={<Link href="/records/new" />} nativeButton={false}>
              첫 기록 남기기
            </Button>
          </EmptyContent>
        </Empty>
      )}

      {recordsQuery.isError || records.length > 0 ? (
        <Button className="h-14 w-full shrink-0" size="lg" render={<Link href="/records/new" />} nativeButton={false}>
          기록 남기기
        </Button>
      ) : null}
    </PageShell>
  );
}
