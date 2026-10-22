"use client";

import { ChatCircleIcon } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { parseISO } from "date-fns";

import {
  formatRecordRegionLabels,
  formatRecordTimelineDate,
  normalizeRecordCategory,
  RECORD_CATEGORY_DOT,
  RecordCategoryBadge,
  type RecordSummary,
  recordDetailQueryOptions,
  recordSummaryQueryKey,
} from "@/entities/record";
import { recordCommentListQueryOptions } from "@/entities/record-comment";
import { cn } from "@/shared/lib/utils";
import { Button, buttonVariants } from "@/shared/ui/button";
import { Empty, EmptyHeader, EmptyTitle } from "@/shared/ui/empty";
import { PressLink } from "@/shared/ui/press-link";
import { Separator } from "@/shared/ui/separator";

import { isMultiDayRecord } from "../../model/record-calendar";

const DAY_TITLE = new Intl.DateTimeFormat("ko-KR", { day: "numeric", month: "long", weekday: "long" });

type RecordDayListProps = {
  date: string;
  onRecordOpen: (record: RecordSummary) => void;
  records: readonly RecordSummary[] | undefined;
};

export function RecordDayList({ date, onRecordOpen, records }: RecordDayListProps) {
  const queryClient = useQueryClient();

  const cacheRecordSummary = (record: RecordSummary) => {
    queryClient.setQueryData(recordSummaryQueryKey(record.id), record);
  };

  const prefetchDetail = (record: RecordSummary) => {
    cacheRecordSummary(record);
    void queryClient.prefetchQuery(recordDetailQueryOptions(record.id));
    void queryClient.prefetchInfiniteQuery(recordCommentListQueryOptions(record.id));
  };

  return (
    <section
      aria-label="선택한 날의 기록"
      className="mt-1 min-h-0 flex-1 overflow-y-auto overscroll-contain border-t pt-3"
    >
      <header className="flex items-center justify-between gap-3 pb-2 pl-1">
        <h3 className="font-bold text-lg leading-7">{DAY_TITLE.format(parseISO(date))}</h3>
        <Button nativeButton={false} render={<PressLink href={`/records/new?date=${date}`} prefetch />} variant="weak">
          기록 남기기
        </Button>
      </header>

      {records ? (
        records.length > 0 ? (
          <ul>
            {records.map((record, index) => {
              const region = formatRecordRegionLabels(record);
              const period = isMultiDayRecord(record)
                ? formatRecordTimelineDate(record.recorded_at, record.recorded_until)
                : null;
              const commentCount = record.record_comments?.[0]?.count ?? 0;

              return (
                <li key={record.id}>
                  {index > 0 ? <Separator className="bg-muted-foreground/20" /> : null}
                  <PressLink
                    className={cn(
                      buttonVariants({ variant: "ghost" }),
                      "h-auto min-h-15 w-full items-start justify-start gap-3 whitespace-normal rounded-none px-1 py-3.5 text-left font-normal after:hidden",
                    )}
                    href={`/records/${record.id}`}
                    onClick={(event) => {
                      if (
                        event.defaultPrevented ||
                        event.button !== 0 ||
                        event.altKey ||
                        event.ctrlKey ||
                        event.metaKey ||
                        event.shiftKey
                      )
                        return;
                      event.preventDefault();
                      cacheRecordSummary(record);
                      onRecordOpen(record);
                    }}
                    onPointerDown={(event) => {
                      if (event.button === 0) prefetchDetail(record);
                    }}
                    prefetch={false}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "mt-0.5 h-4 w-0.75 shrink-0 rounded-full",
                        RECORD_CATEGORY_DOT[normalizeRecordCategory(record.category)],
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block break-words font-semibold text-base leading-5">{record.activity}</span>
                      <span className="mt-1.5 flex min-w-0 items-center gap-1.5 text-muted-foreground text-xs">
                        {period ? <span className="shrink-0 tabular-nums">{period}</span> : null}
                        {period && region ? <span aria-hidden="true">·</span> : null}
                        {region ? <span className="truncate">{region}</span> : null}
                        <RecordCategoryBadge category={record.category} />
                      </span>
                    </span>
                    {commentCount > 0 ? (
                      <span className="inline-flex shrink-0 items-center gap-0.5 text-[11px] text-muted-foreground tabular-nums">
                        <ChatCircleIcon aria-hidden="true" className="size-4" />
                        <span className="sr-only">댓글</span>
                        {commentCount}
                      </span>
                    ) : null}
                  </PressLink>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty className="py-10">
            <EmptyHeader>
              <EmptyTitle className="text-muted-foreground">이날 남긴 기록이 없어요</EmptyTitle>
            </EmptyHeader>
          </Empty>
        )
      ) : null}
    </section>
  );
}
