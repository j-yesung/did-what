import { Fragment } from "react";

import { MapPinIcon } from "@phosphor-icons/react/dist/ssr";

import { normalizeRecordCategories } from "../model/category";
import { getRecordPeriodDays } from "../model/record-period";
import { formatRecordRegionLabels } from "../model/record-region";
import type { RecordSummary } from "../model/types";
import { getRecordWeatherLabel, normalizeRecordWeather } from "../model/weather";
import { RecordCategoryBadge } from "./record-badges";
import { WeatherIcon } from "./weather-icon";

type RecordDetailHeaderProps = {
  record: Pick<
    RecordSummary,
    | "activity"
    | "category"
    | "record_regions"
    | "recorded_at"
    | "recorded_until"
    | "region_code"
    | "region_label"
    | "region_name"
    | "weather"
  >;
  titleId?: string;
};

export function RecordDetailHeader({ record, titleId }: RecordDetailHeaderProps) {
  const weather = normalizeRecordWeather(record.weather);
  const region = formatRecordRegionLabels(record, Number.POSITIVE_INFINITY);
  const categories = normalizeRecordCategories(record.category);

  return (
    <header className="min-w-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-2">
        <p className="whitespace-nowrap font-bold text-[15px] tabular-nums tracking-[-0.01em]">
          {getRecordPeriodDays(record.recorded_at, record.recorded_until).map((day, index) => (
            <Fragment key={day.date}>
              {index > 0 ? <span className="mx-1.5 font-medium text-muted-foreground">–</span> : null}
              <time dateTime={day.date}>
                {day.label}
                <span className="ml-1.5 font-semibold text-muted-foreground text-sm">{day.weekday}</span>
              </time>
            </Fragment>
          ))}
        </p>
        <p className="flex min-w-0 items-center gap-1 font-semibold text-foreground/80 text-sm">
          {region ? (
            <>
              <MapPinIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 break-keep">
                <span className="sr-only">지역 </span>
                {region}
              </span>
              <span aria-hidden="true" className="mx-1.5 h-3 w-px shrink-0 bg-input" />
            </>
          ) : null}
          <WeatherIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" weather={weather} />
          <span className="whitespace-nowrap">
            <span className="sr-only">날씨 </span>
            {getRecordWeatherLabel(weather)}
          </span>
        </p>
      </div>
      <h2
        className="mt-3.5 text-balance break-keep font-extrabold text-[32px] leading-[1.22] tracking-[-0.045em]"
        id={titleId}
      >
        {record.activity}
      </h2>
      {categories.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          <RecordCategoryBadge
            category={categories}
            className="h-6.5 rounded-full px-2.5 py-0 font-bold text-[13px] tracking-[-0.01em]"
          />
        </div>
      ) : null}
    </header>
  );
}
