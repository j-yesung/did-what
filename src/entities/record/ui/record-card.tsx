"use client";

import { CaretRightIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

import { formatRecordPeriod } from "@/shared/lib/date/format-date";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

import { getRecordWeatherLabel, normalizeRecordWeather } from "../model/weather";
import { WeatherIcon } from "./weather-icon";

type RecordCardProps = {
  isLast: boolean;
  record: {
    activity: string;
    id: string;
    memo: string | null;
    recorded_at: string;
    recorded_until: string | null;
    region_label?: string;
    weather: string;
  };
};

export function RecordCard({ isLast, record }: RecordCardProps) {
  const router = useRouter();
  const normalizedWeather = normalizeRecordWeather(record.weather);
  const weatherLabel = getRecordWeatherLabel(normalizedWeather);

  return (
    <article
      className={cn(
        "relative pl-5",
        !isLast && "before:absolute before:top-3.5 before:-bottom-7.5 before:left-1.75 before:w-px before:bg-border",
      )}
    >
      <span
        className="absolute top-1.5 left-0 z-10 size-3.75 rounded-full border-4 border-background bg-primary"
        aria-hidden="true"
      />
      <Button
        className="h-auto justify-start whitespace-normal rounded-lg px-1 py-1.5 text-left font-normal after:hidden [&>span]:block [&>span]:w-full"
        fullWidth
        onClick={() => router.push(`/records/${record.id}`)}
        type="button"
        variant="ghost"
      >
        <header className="flex items-center gap-3 text-muted-foreground text-xs">
          <time dateTime={record.recorded_at}>{formatRecordPeriod(record.recorded_at, record.recorded_until)}</time>
          <CaretRightIcon className="ml-auto shrink-0" strokeWidth={2} aria-hidden="true" />
        </header>

        <h3 className="mt-1 line-clamp-2 font-bold text-base leading-snug tracking-[-0.02em]">{record.activity}</h3>

        <p className="mt-1.5 flex min-w-0 items-center gap-1.5 text-muted-foreground text-xs">
          {record.region_label ? (
            <>
              <span className="truncate">{record.region_label}</span>
              <span className="shrink-0" aria-hidden="true">
                ·
              </span>
            </>
          ) : null}
          <span className="inline-flex shrink-0 items-center gap-1">
            <WeatherIcon weather={normalizedWeather} className="size-4" aria-hidden="true" />
            {weatherLabel}
          </span>
        </p>
        {record.memo ? (
          <p className="mt-1.5 line-clamp-2 text-[13px] text-muted-foreground leading-relaxed">{record.memo}</p>
        ) : null}
      </Button>
    </article>
  );
}
