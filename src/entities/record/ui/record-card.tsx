"use client";

import { ChatCircleIcon } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { PressLink } from "@/shared/ui/press-link";

import { recordPlacesQueryOptions, recordSummaryQueryKey } from "../api/queries";
import { normalizeRecordCategory, RECORD_CATEGORY_DOT } from "../model/category";
import { formatRecordRegionLabels } from "../model/record-region";
import { formatRecordTimelineDate } from "../model/record-timeline";
import type { RecordSummary } from "../model/types";
import { RecordCategoryBadge } from "./record-badges";

type RecordCardProps = {
  endsMonth: boolean;
  onDetailPrefetch?: (recordId: string) => void;
  record: RecordSummary;
  side: "left" | "right";
};

export function RecordCard({ endsMonth, onDetailPrefetch, record, side }: RecordCardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const href = `/records/${record.id}`;
  const commentCount = record.record_comments?.[0]?.count ?? 0;
  const regionLabels = formatRecordRegionLabels(record);
  const category = normalizeRecordCategory(record.category);
  const cacheRecordSummary = () => queryClient.setQueryData(recordSummaryQueryKey(record.id), record);

  return (
    <article
      className="relative grid min-w-0 grid-cols-[minmax(0,1fr)_2rem_minmax(0,1fr)] pb-6"
      data-timeline-side={side}
    >
      <span aria-hidden="true" className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border" />
      {endsMonth ? (
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-border"
        />
      ) : null}
      <Button
        className={cn(
          "row-start-1 h-auto min-h-18 min-w-0 justify-start whitespace-normal rounded-md p-0 font-normal after:hidden [&>span]:block [&>span]:w-full",
          side === "left" ? "col-start-1 text-right" : "col-start-3 text-left",
        )}
        fullWidth
        nativeButton={false}
        render={
          <PressLink
            href={href}
            onClick={cacheRecordSummary}
            onPointerDown={(event) => {
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
          <time
            className="mb-1.5 block text-[11px] text-muted-foreground tabular-nums leading-normal"
            dateTime={record.recorded_at}
          >
            {formatRecordTimelineDate(record.recorded_at, record.recorded_until)}
          </time>
          <h3 className="relative min-w-0 break-words font-semibold text-base leading-relaxed tracking-[-0.035em]">
            {record.activity}
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute top-2 z-10 size-2 rounded-full ring-3 ring-background",
                RECORD_CATEGORY_DOT[category],
                side === "left" ? "-right-5" : "-left-5",
              )}
            />
          </h3>
          {record.memo?.trim() ? (
            <p className="mt-1.5 line-clamp-2 break-words text-dark-weak-foreground text-xs leading-relaxed">
              {record.memo}
            </p>
          ) : null}
          {regionLabels ? (
            <p className="mt-1.5 break-words text-[11px] text-muted-foreground leading-relaxed">{regionLabels}</p>
          ) : null}
          <span
            className={cn(
              "mt-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground text-xs",
              side === "left" && "justify-end",
            )}
          >
            <RecordCategoryBadge category={record.category} />
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
