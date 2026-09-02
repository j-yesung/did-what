"use client";

import { CaretRightIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

import { formatRecordPeriod } from "@/shared/lib/date/format-date";
import { Button } from "@/shared/ui/button";

import { getRecordWeatherLabel, normalizeRecordWeather } from "../model/weather";
import { WeatherIcon } from "./weather-icon";

type RecordCardProps = {
  activity: string;
  memo?: string | null;
  recordId: string;
  recordedAt: string;
  recordedUntil?: string | null;
  region?: { label: string; name: string };
  weather: string;
};

export function RecordCard({ activity, memo, recordId, recordedAt, recordedUntil, region, weather }: RecordCardProps) {
  const router = useRouter();
  const normalizedWeather = normalizeRecordWeather(weather);
  const weatherLabel = getRecordWeatherLabel(normalizedWeather);

  return (
    <article className="relative pl-5">
      <span
        className="absolute top-1.5 left-0 size-3.75 rounded-full border-4 border-background bg-primary"
        aria-hidden="true"
      />
      <Button
        className="h-auto justify-start whitespace-normal rounded-lg px-1 py-1.5 text-left font-normal after:hidden [&>span]:block [&>span]:w-full"
        fullWidth
        onClick={() => router.push(`/records/${recordId}`)}
        type="button"
        variant="ghost"
      >
        <header className="flex items-center gap-3 text-muted-foreground text-xs">
          <time dateTime={recordedAt}>{formatRecordPeriod(recordedAt, recordedUntil)}</time>
          <CaretRightIcon className="ml-auto shrink-0" strokeWidth={2} aria-hidden="true" />
        </header>

        <h3 className="mt-1 line-clamp-2 font-bold text-base leading-snug tracking-[-0.02em]">{activity}</h3>

        <p className="mt-1.5 flex min-w-0 items-center gap-1.5 text-muted-foreground text-xs">
          {region ? (
            <>
              <span className="truncate">{region.label}</span>
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
        {memo ? <p className="mt-1.5 line-clamp-2 text-[13px] text-muted-foreground leading-relaxed">{memo}</p> : null}
      </Button>
    </article>
  );
}
