"use client";

import { CaretRightIcon, ChatCircleIcon } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { formatRecordPeriod } from "@/shared/lib/date/format-date";
import { useLongPress } from "@/shared/lib/use-long-press";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { PressLink } from "@/shared/ui/press-link";

import { recordPlacesQueryOptions, recordSummaryQueryKey } from "../api/queries";
import { formatRecordRegionLabels } from "../model/record-region";
import type { RecordSummary } from "../model/types";
import { RecordBadges } from "./record-badges";

type RecordCardProps = {
  isLast: boolean;
  onDetailPrefetch?: (recordId: string) => void;
  /** 꾹 눌렀을 때. 넘기지 않으면 꾹 누름을 듣지 않는다. */
  onLongPress?: () => void;
  record: RecordSummary;
  startsDate: boolean;
};

const WEEKDAY = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", weekday: "short" });

export function RecordCard({ isLast, onDetailPrefetch, onLongPress, record, startsDate }: RecordCardProps) {
  const router = useRouter();
  const longPress = useLongPress(onLongPress);
  const queryClient = useQueryClient();
  const href = `/records/${record.id}`;
  const commentCount = record.record_comments?.[0]?.count ?? 0;
  const regionLabels = formatRecordRegionLabels(record);
  // 하루짜리는 왼쪽 날짜 칸이 이미 말해 준다. 여러 날에 걸친 기록만 기간을 따로 적는다.
  const period =
    record.recorded_until && record.recorded_until !== record.recorded_at
      ? formatRecordPeriod(record.recorded_at, record.recorded_until)
      : null;

  const cacheRecordSummary = () => queryClient.setQueryData(recordSummaryQueryKey(record.id), record);

  return (
    <article className="grid grid-cols-[3rem_1rem_minmax(0,1fr)] gap-x-1">
      <div className="pt-3 text-center">
        {startsDate ? (
          <time
            aria-label={formatRecordPeriod(record.recorded_at)}
            className="flex flex-col items-center tabular-nums"
            dateTime={record.recorded_at}
          >
            <span className="font-bold text-2xl leading-none">{Number(record.recorded_at.slice(8, 10))}</span>
            <span className="mt-1 text-muted-foreground text-xs">
              {WEEKDAY.format(new Date(`${record.recorded_at}T00:00:00+09:00`))}
            </span>
          </time>
        ) : null}
      </div>
      <div className="relative flex justify-center" aria-hidden="true">
        <span className={cn("absolute top-0 left-1/2 w-px -translate-x-1/2 bg-border", isLast ? "h-5" : "bottom-0")} />
        {startsDate ? (
          <span className="absolute top-4 z-10 size-2.5 rounded-full border-2 border-background bg-primary" />
        ) : null}
      </div>
      <Button
        className="h-auto min-h-18 justify-start whitespace-normal rounded-none px-2 py-3 text-left font-normal after:hidden [&>span]:block [&>span]:w-full"
        fullWidth
        nativeButton={false}
        render={
          <PressLink
            {...longPress}
            href={href}
            onClick={cacheRecordSummary}
            onPointerDown={(event) => {
              longPress.onPointerDown?.(event);
              if (event.button !== 0) return;
              cacheRecordSummary();
              router.prefetch(href);
              void queryClient.prefetchQuery(recordPlacesQueryOptions(record.id));
              onDetailPrefetch?.(record.id);
            }}
            prefetch={false}
          />
        }
        variant="ghost"
      >
        <span className="min-w-0">
          <h3 className="flex min-w-0 items-center justify-between gap-2 font-bold text-base leading-snug tracking-[-0.02em]">
            <span className="line-clamp-2 min-w-0 flex-1">{record.activity}</span>
            <CaretRightIcon className="shrink-0 text-muted-foreground" strokeWidth={2} aria-hidden="true" />
          </h3>
          <span className="mt-1.5 flex min-w-0 items-center justify-between gap-2 text-muted-foreground text-xs">
            <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
              {/* 긴 기간 표기는 지역·배지와 한 줄에 못 들어간다. 줄을 통째로 차지해 뒤가 밀리지 않게 한다. */}
              {period ? <span className="w-full shrink-0 tabular-nums">{period}</span> : null}
              {regionLabels ? (
                <>
                  <span className="truncate">{regionLabels}</span>
                  <span className="shrink-0" aria-hidden="true">
                    ·
                  </span>
                </>
              ) : null}
              <RecordBadges record={record} />
            </span>
            {commentCount > 0 ? (
              <span className="inline-flex shrink-0 items-center gap-0.5 tabular-nums">
                <ChatCircleIcon className="size-4" aria-hidden="true" />
                <span className="sr-only">댓글</span>
                {commentCount}
              </span>
            ) : null}
          </span>
        </span>
      </Button>
    </article>
  );
}
