"use client";

import { NotePencilIcon } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";

import {
  EmptyRecords,
  hasRecordFilters,
  type RecordFilters,
  RecordTimeline,
  RecordTimelineItems,
} from "@/entities/record";
import { recordCommentListQueryOptions } from "@/entities/record-comment";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/shared/ui/empty";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { LoadMoreButton } from "@/shared/ui/load-more-button";

import { useRecordListQuery } from "../../model/use-record-list-query";

type RecordListProps = {
  filters: RecordFilters;
  onFiltersReset: () => void;
};

export function RecordList({ filters, onFiltersReset }: RecordListProps) {
  const queryClient = useQueryClient();
  const recordsQuery = useRecordListQuery(filters);
  const prefetchComments = (recordId: string) => {
    void queryClient.prefetchInfiniteQuery(recordCommentListQueryOptions(recordId));
  };

  if (recordsQuery.isPending) return null;

  if (recordsQuery.isError) {
    return (
      <LoadErrorAlert
        icon={<NotePencilIcon aria-hidden="true" />}
        onRetry={() => void recordsQuery.refetch()}
        retrying={recordsQuery.isFetching}
        title="기록을 불러오지 못했어요"
      />
    );
  }

  const records = recordsQuery.data.pages.flatMap((page) => page.records);
  const isFiltered = hasRecordFilters(filters);
  const isLoadingMore = recordsQuery.isPlaceholderData || recordsQuery.isFetchingNextPage;

  if (records.length === 0 && recordsQuery.isPlaceholderData) return null;

  if (records.length === 0) {
    return isFiltered ? (
      <Empty className="flex-1 px-1 py-10">
        <EmptyHeader>
          <EmptyTitle className="font-semibold text-base">조건에 맞는 기록이 없어요</EmptyTitle>
          <EmptyDescription className="text-sm/normal">검색어나 기간을 조정해 보세요.</EmptyDescription>
        </EmptyHeader>
        <Button className="text-accent-text" onClick={onFiltersReset} variant="ghost">
          전체 기록 보기
        </Button>
      </Empty>
    ) : (
      <EmptyRecords title="아직 남긴 기록이 없어요" />
    );
  }

  return (
    <RecordTimeline
      aria-busy={recordsQuery.isPlaceholderData || undefined}
      aria-label={`불러온 기록 ${records.length}개`}
      className={cn(
        "transition-opacity duration-200 motion-reduce:transition-none",
        recordsQuery.isPlaceholderData && "opacity-50",
      )}
    >
      <RecordTimelineItems records={records} onDetailPrefetch={prefetchComments} />
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
