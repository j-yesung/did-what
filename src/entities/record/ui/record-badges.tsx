import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";

import { getRecordCategoryLabel, normalizeRecordCategories, RECORD_CATEGORY_BADGE } from "../model/category";
import type { RecordSummary } from "../model/types";
import { getRecordWeatherLabel, normalizeRecordWeather } from "../model/weather";
import { WeatherIcon } from "./weather-icon";

export function RecordCategoryBadge({
  category: value,
  className,
}: {
  category: RecordSummary["category"];
  className?: string;
}) {
  return normalizeRecordCategories(value).map((category) => (
    <Badge
      className={cn("shrink-0 rounded-full px-1.5 py-0.5 font-medium", RECORD_CATEGORY_BADGE[category], className)}
      key={category}
    >
      {getRecordCategoryLabel(category)}
    </Badge>
  ));
}

export function RecordWeatherBadge({ weather: value }: { weather: RecordSummary["weather"] }) {
  const weather = normalizeRecordWeather(value);

  return (
    <Badge className="gap-1 rounded-full border border-border bg-surface px-2 py-1 font-medium">
      <WeatherIcon aria-hidden="true" className="size-3.5" weather={weather} />
      {getRecordWeatherLabel(weather)}
    </Badge>
  );
}
