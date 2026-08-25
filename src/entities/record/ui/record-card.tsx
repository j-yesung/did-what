import { MapPinIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { getRecordWeatherLabel, normalizeRecordWeather } from "@/entities/record/model/weather";
import { WeatherIcon } from "@/entities/record/ui/weather-icon";
import { formatRecordPeriod } from "@/shared/lib/date/format-date";
import { FOCUS_RING, PRESS_FEEDBACK } from "@/shared/lib/interaction";
import { cn } from "@/shared/lib/utils";

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
  const normalizedWeather = normalizeRecordWeather(weather);

  return (
    <article className="relative pl-5">
      <span
        className="absolute top-1.5 left-0 size-3.75 rounded-full border-4 border-background bg-primary"
        aria-hidden="true"
      />
      <Link
        className={cn("block rounded-lg px-1 py-1.5 after:hidden", FOCUS_RING, PRESS_FEEDBACK)}
        href={`/records/${recordId}`}
      >
        <header className="flex items-center gap-3 text-muted-foreground text-xs">
          <time dateTime={recordedAt}>{formatRecordPeriod(recordedAt, recordedUntil)}</time>
          <span
            className="ml-auto inline-flex shrink-0 items-center"
            aria-label={getRecordWeatherLabel(normalizedWeather)}
          >
            <WeatherIcon weather={normalizedWeather} className="size-4" aria-hidden="true" />
          </span>
        </header>

        <h3 className="mt-1 line-clamp-2 font-bold text-base leading-snug tracking-[-0.02em]">{activity}</h3>

        {region ? (
          <p className="mt-1.5 flex items-center gap-1.5 text-muted-foreground text-xs">
            <MapPinIcon strokeWidth={2} className="size-3.5 shrink-0" aria-hidden="true" />
            {region.label} / {region.name}
          </p>
        ) : null}
        {memo ? <p className="mt-1.5 line-clamp-2 text-[13px] text-muted-foreground leading-relaxed">{memo}</p> : null}
      </Link>
    </article>
  );
}
