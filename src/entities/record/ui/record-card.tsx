"use client";

import { ChatCircleIcon } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { PressLink } from "@/shared/ui/press-link";

import { cacheRecordSummary, prefetchRecordDetail } from "../api/record-summary";
import { normalizeRecordCategory, RECORD_CATEGORY_DOT } from "../model/category";
import { formatRecordRegionLabels } from "../model/record-region";
import { formatRecordTimelineDate } from "../model/record-timeline";
import type { RecordSummary } from "../model/types";
import { RecordCategoryBadge } from "./record-badges";

type RecordCardProps = {
  endsMonth: boolean;
  onDetailPrefetch?: (recordId: string) => void;
  record: RecordSummary;
};

export function RecordCard({ endsMonth, onDetailPrefetch, record }: RecordCardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const href = `/records/${record.id}`;
  const commentCount = record.record_comments?.[0]?.count ?? 0;
  const regionLabels = formatRecordRegionLabels(record);
  const category = normalizeRecordCategory(record.category);
  const cacheSummary = () => cacheRecordSummary(queryClient, record);

  return (
    <article className="relative ml-1.5 min-w-0 border-border border-l pb-7 pl-5">
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-1.5 -left-px z-10 size-2.25 -translate-x-1/2 rounded-full ring-3 ring-background",
          RECORD_CATEGORY_DOT[category],
        )}
      />
      {endsMonth ? (
        <span
          aria-hidden="true"
          className="absolute bottom-0 -left-px size-1.5 -translate-x-1/2 rounded-full bg-border"
        />
      ) : null}
      <Button
        className="h-auto min-h-18 min-w-0 justify-start whitespace-normal rounded-md p-0 text-left font-normal after:hidden [&>span]:block [&>span]:w-full"
        fullWidth
        nativeButton={false}
        render={
          <PressLink
            href={href}
            onClick={cacheSummary}
            onPointerDown={(event) => {
              if (event.button !== 0) return;
              router.prefetch(href);
              prefetchRecordDetail(queryClient, record.id, record);
              onDetailPrefetch?.(record.id);
            }}
            prefetch={false}
          />
        }
        variant="ghost"
      >
        <span className="block min-w-0">
          <time
            className="mb-1 block text-muted-foreground text-xs tabular-nums leading-normal"
            dateTime={record.recorded_at}
          >
            {formatRecordTimelineDate(record.recorded_at, record.recorded_until)}
          </time>
          <h3 className="min-w-0 break-words font-semibold text-[17px] leading-normal tracking-[-0.025em]">
            {record.activity}
          </h3>
          {record.memo?.trim() ? (
            <p className="mt-1.5 line-clamp-2 break-words text-[13px] text-dark-weak-foreground leading-relaxed">
              {record.memo}
            </p>
          ) : null}
          {regionLabels ? (
            <p className="mt-1.5 break-words text-muted-foreground text-xs leading-relaxed">{regionLabels}</p>
          ) : null}
          <span className="mt-2 flex min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1 text-muted-foreground text-xs">
            <span className="flex flex-wrap items-center gap-1">
              <RecordCategoryBadge category={record.category} />
            </span>
            {commentCount > 0 ? (
              <span className="inline-flex shrink-0 items-center gap-0.5 text-[11px] tabular-nums">
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
