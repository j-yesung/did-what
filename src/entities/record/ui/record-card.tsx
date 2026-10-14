"use client";

import { ChatCircleIcon } from "@phosphor-icons/react";
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
import { RecordCategoryBadge } from "./record-badges";

type RecordCardProps = {
  endsDate: boolean;
  onDetailPrefetch?: (recordId: string) => void;
  /** 꾹 눌렀을 때. 넘기지 않으면 꾹 누름을 듣지 않는다. */
  onLongPress?: () => void;
  record: RecordSummary;
  startsDate: boolean;
};

const WEEKDAY = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", weekday: "long" });

export function RecordCard({ endsDate, onDetailPrefetch, onLongPress, record, startsDate }: RecordCardProps) {
  const router = useRouter();
  const longPress = useLongPress(onLongPress);
  const queryClient = useQueryClient();
  const href = `/records/${record.id}`;
  const commentCount = record.record_comments?.[0]?.count ?? 0;
  const regionLabels = formatRecordRegionLabels(record);
  // 날짜 구분과 중복되지 않도록 여러 날에 걸친 기록만 기간을 적는다.
  const period =
    record.recorded_until && record.recorded_until !== record.recorded_at
      ? formatRecordPeriod(record.recorded_at, record.recorded_until)
      : null;

  const cacheRecordSummary = () => queryClient.setQueryData(recordSummaryQueryKey(record.id), record);

  return (
    <article className={cn("min-w-0", endsDate && "border-border border-b pb-3")}>
      {startsDate ? (
        <time
          aria-label={formatRecordPeriod(record.recorded_at)}
          className="mt-7 mb-1 block px-1 font-semibold text-[13px] text-accent-text tabular-nums"
          dateTime={record.recorded_at}
        >
          {Number(record.recorded_at.slice(5, 7))}월 {Number(record.recorded_at.slice(8, 10))}일{" "}
          {WEEKDAY.format(new Date(`${record.recorded_at}T00:00:00+09:00`))}
        </time>
      ) : null}
      <Button
        className="h-auto min-h-18 justify-start whitespace-normal rounded-none px-1 py-4 text-left font-normal after:hidden [&>span]:block [&>span]:w-full"
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
          <h3 className="line-clamp-2 min-w-0 break-words font-semibold text-xl leading-normal tracking-[-0.035em]">
            {record.activity}
          </h3>
          {period ? <p className="mt-1.5 text-accent-text text-xs tabular-nums">{period}</p> : null}
          {record.memo?.trim() ? (
            <p className="mt-2 line-clamp-2 break-words text-dark-weak-foreground text-sm leading-relaxed">
              {record.memo}
            </p>
          ) : null}
          <span className="mt-3 flex min-w-0 items-center justify-between gap-3 text-muted-foreground text-xs leading-relaxed">
            <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
              {regionLabels ? <span className="min-w-0 break-words">{regionLabels}</span> : null}
              <RecordCategoryBadge category={record.category} />
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
