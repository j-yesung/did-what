"use client";

import { CaretRightIcon, ChatCircleIcon } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { formatRecordPeriod } from "@/shared/lib/date/format-date";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { PressLink } from "@/shared/ui/press-link";

import { recordPlacesQueryOptions, recordSummaryQueryKey } from "../api/queries";
import type { RecordSummary } from "../model/types";
import { getRecordWeatherLabel, normalizeRecordWeather } from "../model/weather";
import { WeatherIcon } from "./weather-icon";

type RecordCardProps = {
  isLast: boolean;
  onDetailPrefetch?: (recordId: string) => void;
  record: RecordSummary;
  startsDate: boolean;
};

const WEEKDAY = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", weekday: "short" });

const formatMonthDay = (date: string) => {
  const [, month, day] = date.split("-");
  return `${Number(month)}.${Number(day)}`;
};

export function RecordCard({ isLast, onDetailPrefetch, record, startsDate }: RecordCardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const normalizedWeather = normalizeRecordWeather(record.weather);
  const weatherLabel = getRecordWeatherLabel(normalizedWeather);
  const href = `/records/${record.id}`;
  const commentCount = record.record_comments?.[0]?.count ?? 0;
  const period =
    record.recorded_until && record.recorded_until !== record.recorded_at
      ? `${formatMonthDay(record.recorded_at)}–${formatMonthDay(record.recorded_until)}`
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
          <h3 className="flex min-w-0 items-center justify-between gap-2 font-bold text-base leading-snug tracking-[-0.02em]">
            <span className="line-clamp-2 min-w-0 flex-1">{record.activity}</span>
            <CaretRightIcon className="shrink-0 text-muted-foreground" strokeWidth={2} aria-hidden="true" />
          </h3>
          <span className="mt-1.5 flex min-w-0 items-center justify-between gap-2 text-muted-foreground text-xs">
            <span className="flex min-w-0 items-center gap-1.5">
              {period ? (
                <>
                  <span className="shrink-0 tabular-nums">{period}</span>
                  <span className="shrink-0" aria-hidden="true">
                    ·
                  </span>
                </>
              ) : null}
              {record.region_label ? (
                <>
                  <span className="truncate">{record.region_label}</span>
                  <span className="shrink-0" aria-hidden="true">
                    ·
                  </span>
                </>
              ) : null}
              <Badge className="gap-1 rounded-full px-1.5 py-0.5 font-medium" tone="neutral">
                <WeatherIcon weather={normalizedWeather} className="size-3.5" aria-hidden="true" />
                {weatherLabel}
              </Badge>
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
