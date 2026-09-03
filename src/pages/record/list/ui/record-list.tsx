"use client";

import { MagnifyingGlassMinusIcon, NotePencilIcon } from "@phosphor-icons/react";
import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";

import {
  EmptyRecords,
  hasRecordFilters,
  RecordCard,
  type RecordFilters,
  RecordTimeline,
  recordListQueryOptions,
} from "@/entities/record";
import { Button } from "@/shared/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { Spinner } from "@/shared/ui/spinner";

type RecordListProps = {
  filters: RecordFilters;
};

export function RecordList({ filters }: RecordListProps) {
  const recordsQuery = useInfiniteQuery(recordListQueryOptions(filters));

  if (recordsQuery.isPending) {
    return (
      <div className="fixed inset-0 grid place-items-center">
        <Spinner
          aria-label="기록을 불러오는 중"
          className="motion-safe:fade-in text-muted-foreground motion-safe:animate-in motion-safe:fill-mode-both motion-safe:delay-300"
        />
      </div>
    );
  }

  if (recordsQuery.isError) {
    return (
      <LoadErrorAlert icon={<NotePencilIcon strokeWidth={2} aria-hidden="true" />} title="기록을 불러오지 못했어요" />
    );
  }

  const records = recordsQuery.data.pages.flatMap((page) => page.records);
  const isFiltered = hasRecordFilters(filters);

  if (records.length === 0) {
    return isFiltered ? (
      <Empty className="border bg-card py-14">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MagnifyingGlassMinusIcon strokeWidth={2} aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>조건에 맞는 기록이 없어요</EmptyTitle>
          <EmptyDescription>검색어를 바꾸거나 기간을 넓혀 보세요.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button nativeButton={false} render={<Link href="/records" />} variant="outline">
            전체 기록 보기
          </Button>
        </EmptyContent>
      </Empty>
    ) : (
      <EmptyRecords title="아직 남긴 기록이 없어요" />
    );
  }

  return (
    <RecordTimeline aria-label={`불러온 기록 ${records.length}개`}>
      <p className="px-1 text-muted-foreground text-xs">{isFiltered ? "조건에 맞는 기록" : "최근 기록"}</p>
      {records.map((record) => (
        <RecordCard
          activity={record.activity}
          key={record.id}
          memo={record.memo}
          recordId={record.id}
          recordedAt={record.recorded_at}
          recordedUntil={record.recorded_until}
          region={{ label: record.region_label, name: record.region_name }}
          weather={record.weather}
        />
      ))}
      {recordsQuery.hasNextPage ? (
        <div className="flex flex-col items-center gap-2 pt-2" aria-live="polite">
          {recordsQuery.isFetchNextPageError ? (
            <p className="text-destructive text-xs">기록을 더 불러오지 못했어요.</p>
          ) : null}
          <Button
            loading={recordsQuery.isFetchingNextPage}
            onClick={() => recordsQuery.fetchNextPage()}
            size="medium"
            type="button"
            variant="outline"
          >
            {recordsQuery.isFetchNextPageError ? "다시 시도" : "더 보기"}
          </Button>
        </div>
      ) : null}
    </RecordTimeline>
  );
}
