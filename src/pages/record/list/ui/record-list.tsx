"use client";

import { MagnifyingGlassMinusIcon, NotePencilIcon } from "@phosphor-icons/react";
import Link from "next/link";

import { EmptyRecords, hasRecordFilters, RecordCard, type RecordFilters, RecordTimeline } from "@/entities/record";
import { Button } from "@/shared/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { LoadMoreButton } from "@/shared/ui/load-more-button";

import { useRecordListQuery } from "../model/use-record-list-query";

type RecordListProps = {
  filters: RecordFilters;
};

export function RecordList({ filters }: RecordListProps) {
  const recordsQuery = useRecordListQuery(filters);

  if (recordsQuery.isPending) return null;

  if (recordsQuery.isError) {
    return <LoadErrorAlert icon={<NotePencilIcon aria-hidden="true" />} title="기록을 불러오지 못했어요" />;
  }

  const records = recordsQuery.data.pages.flatMap((page) => page.records);
  const isFiltered = hasRecordFilters(filters);
  const isLoadingMore = recordsQuery.isPlaceholderData || recordsQuery.isFetchingNextPage;

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
      {records.map((record, index) => (
        <RecordCard isLast={index === records.length - 1} key={record.id} record={record} />
      ))}
      {recordsQuery.hasNextPage ? (
        <LoadMoreButton
          error={recordsQuery.isFetchNextPageError ? "기록을 더 불러오지 못했어요." : undefined}
          loading={isLoadingMore}
          onClick={() => recordsQuery.fetchNextPage()}
        />
      ) : null}
    </RecordTimeline>
  );
}
