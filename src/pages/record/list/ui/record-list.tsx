"use client";

import { Fragment, useState } from "react";

import { NotePencilIcon } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";

import {
  EmptyRecords,
  formatRecordTimelineMonth,
  getRecordTimelineItemState,
  hasRecordFilters,
  RecordCard,
  type RecordFilters,
  type RecordSummary,
  RecordTimeline,
} from "@/entities/record";
import { recordCommentListQueryOptions } from "@/entities/record-comment";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/shared/ui/empty";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { LoadMoreButton } from "@/shared/ui/load-more-button";
import { PressLink } from "@/shared/ui/press-link";

import { useRecordListQuery } from "../model/use-record-list-query";
import { RecordActionSheet } from "./record-action-sheet";

type RecordListProps = {
  filters: RecordFilters;
};

export function RecordList({ filters }: RecordListProps) {
  const queryClient = useQueryClient();
  const recordsQuery = useRecordListQuery(filters);
  // 시트는 계속 띄워 두고 open만 여닫는다. 닫히는 동안 내용이 사라지지 않고 여는 전환도 그대로 탄다.
  const [actionTarget, setActionTarget] = useState<RecordSummary | null>(null);
  const [actionOpen, setActionOpen] = useState(false);

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
      <Empty className="flex-1 gap-3 rounded-none border-0 px-1 py-10">
        <EmptyHeader className="gap-1">
          <EmptyTitle className="font-semibold text-base">조건에 맞는 기록이 없어요</EmptyTitle>
          <EmptyDescription className="text-sm/normal">검색어나 기간을 조정해 보세요.</EmptyDescription>
        </EmptyHeader>
        <Button className="text-primary" nativeButton={false} render={<PressLink href="/records" />} variant="ghost">
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
        "gap-0 transition-opacity duration-200 motion-reduce:transition-none",
        recordsQuery.isPlaceholderData && "opacity-50",
      )}
    >
      {records.map((record, index) => {
        const { startsDate, startsMonth } = getRecordTimelineItemState(records, index);

        return (
          <Fragment key={record.id}>
            {startsMonth ? (
              <p className={cn("px-1 pb-2 font-bold text-lg tracking-[-0.025em]", index > 0 && "mt-6")}>
                {formatRecordTimelineMonth(record.recorded_at)}
              </p>
            ) : null}
            <RecordCard
              isLast={index === records.length - 1}
              onDetailPrefetch={prefetchComments}
              onLongPress={() => {
                setActionTarget(record);
                setActionOpen(true);
              }}
              record={record}
              startsDate={startsDate}
            />
          </Fragment>
        );
      })}
      {recordsQuery.hasNextPage ? (
        <LoadMoreButton
          error={recordsQuery.isFetchNextPageError ? "기록을 더 불러오지 못했어요." : undefined}
          loading={isLoadingMore}
          onClick={() => recordsQuery.fetchNextPage()}
        />
      ) : null}
      <RecordActionSheet onOpenChange={setActionOpen} open={actionOpen} record={actionTarget} />
    </RecordTimeline>
  );
}
