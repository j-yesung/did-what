import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";

import { getRecordCategoryLabel, normalizeRecordCategory, RECORD_CATEGORY_FILL } from "../model/category";
import type { RecordSummary } from "../model/types";
import { getRecordWeatherLabel, normalizeRecordWeather } from "../model/weather";
import { WeatherIcon } from "./weather-icon";

type RecordBadgesProps = {
  /** 두 배지에 함께 붙는다. 상세처럼 넓은 화면에서 배지를 키울 때 쓴다. */
  className?: string;
  record: Pick<RecordSummary, "category" | "weather">;
};

/** 카테고리와 날씨 배지. 카드·동작 시트·상세가 같은 표시를 써야 목록에서 본 기록과 바로 이어진다. */
export function RecordBadges({ className, record }: RecordBadgesProps) {
  const category = normalizeRecordCategory(record.category);
  const weather = normalizeRecordWeather(record.weather);

  return (
    <>
      {category === "uncategorized" ? null : (
        <Badge
          className={cn(
            "rounded-full px-1.5 py-0.5 font-medium text-foreground",
            RECORD_CATEGORY_FILL[category],
            className,
          )}
        >
          {getRecordCategoryLabel(category)}
        </Badge>
      )}
      <Badge className={cn("gap-1 rounded-full px-1.5 py-0.5 font-medium", className)} tone="neutral">
        <WeatherIcon aria-hidden="true" className="size-3.5" weather={weather} />
        {getRecordWeatherLabel(weather)}
      </Badge>
    </>
  );
}
