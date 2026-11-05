"use client";

import { NotePencilIcon } from "@phosphor-icons/react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

import {
  EmptyRecords,
  hasRecordFilters,
  type RecordFilters,
  RecordTimelineItems,
  recordListQueryOptions,
} from "@/entities/record";
import { recordCommentListQueryOptions } from "@/entities/record-comment";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/shared/ui/empty";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { LoadMoreButton } from "@/shared/ui/load-more-button";
import { Spinner } from "@/shared/ui/spinner";

type RecordListProps = { filters: RecordFilters; searchLoading?: boolean } & (
  | { emptyTitle?: never; onFiltersReset: () => void }
  | { emptyTitle: string; onFiltersReset?: never }
);

export function RecordList({ emptyTitle, filters, onFiltersReset, searchLoading }: RecordListProps) {
  const queryClient = useQueryClient();
  const recordsQuery = useInfiniteQuery(recordListQueryOptions(filters));
  const prefetchComments = (recordId: string) => {
    void queryClient.prefetchInfiniteQuery(recordCommentListQueryOptions(recordId));
  };

  if (recordsQuery.isPending || (filters.query && recordsQuery.isPlaceholderData)) {
    if (searchLoading) {
      return (
        <div className="grid flex-1 place-items-center text-muted-foreground">
          <Spinner aria-label="검색 중" />
        </div>
      );
    }
    return (
      <div role="status" className="flex items-center gap-2 py-6 text-muted-foreground text-sm">
        <Spinner />
        {filters.query ? `“${filters.query}” 검색 중이에요` : "기록을 불러오는 중이에요"}
      </div>
    );
  }

  if (recordsQuery.isError) {
    return (
      <LoadErrorAlert
        icon={<NotePencilIcon aria-hidden="true" />}
        onRetry={() => void recordsQuery.refetch()}
        retrying={recordsQuery.isFetching}
        title={filters.query ? `“${filters.query}” 검색을 완료하지 못했어요` : "기록을 불러오지 못했어요"}
      />
    );
  }

  const records = recordsQuery.data.pages.flatMap((page) => page.records);
  const isFiltered = hasRecordFilters(filters);
  const isLoadingMore = recordsQuery.isPlaceholderData || recordsQuery.isFetchingNextPage;

  if (records.length === 0 && recordsQuery.isPlaceholderData) return null;

  if (records.length === 0) {
    if (emptyTitle) {
      return (
        <Empty className="flex-1 px-1 py-10">
          <EmptyHeader>
            <EmptyTitle className="font-semibold text-base">{emptyTitle}</EmptyTitle>
          </EmptyHeader>
        </Empty>
      );
    }

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
    <section
      aria-busy={recordsQuery.isPlaceholderData || undefined}
      aria-label={`불러온 기록 ${records.length}개`}
      className={cn(
        "flex flex-col transition-opacity duration-200 motion-reduce:transition-none",
        recordsQuery.isPlaceholderData && "opacity-50",
      )}
    >
      {filters.query ? (
        <p role="status" className="sr-only">
          “{filters.query}” 검색 완료.{" "}
          {recordsQuery.hasNextPage ? "결과를 더 불러올 수 있어요." : `${records.length}개의 기록을 찾았어요.`}
        </p>
      ) : null}
      <RecordTimelineItems records={records} onDetailPrefetch={prefetchComments} />
      {recordsQuery.hasNextPage ? (
        <LoadMoreButton
          error={recordsQuery.isFetchNextPageError ? "기록을 더 불러오지 못했어요." : undefined}
          loading={isLoadingMore}
          onClick={() => recordsQuery.fetchNextPage()}
        />
      ) : null}
    </section>
  );
}
