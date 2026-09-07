"use client";

import { useState } from "react";

import {
  DEFAULT_RECORD_WEATHER,
  isRecordWeather,
  RECORD_WEATHER_OPTIONS,
  type RecordWeather,
  WeatherIcon,
} from "@/entities/record";
import { Field, FieldError, FieldLegend, FieldSet } from "@/shared/ui/field";
import { SegmentedControl, SegmentedControlItem } from "@/shared/ui/segmented-control";

const FIELD_ICON = "size-4.5 text-foreground [stroke-width:2]";

type RecordWeatherFieldProps = {
  initialWeather?: RecordWeather;
  onChange?: (weather: RecordWeather) => void;
  weatherError?: string;
};

export function RecordWeatherField({
  initialWeather = DEFAULT_RECORD_WEATHER,
  onChange,
  weatherError,
}: RecordWeatherFieldProps) {
  const [weather, setWeather] = useState<RecordWeather>(initialWeather);

  function handleWeatherChange(nextWeather: string) {
    if (!isRecordWeather(nextWeather)) return;
    setWeather(nextWeather);
    onChange?.(nextWeather);
  }

  return (
    <FieldSet>
      <FieldLegend className="flex items-center gap-2" id="record-weather-label" variant="label">
        날씨
        <WeatherIcon weather={weather} className={FIELD_ICON} aria-hidden="true" />
      </FieldLegend>
      <Field data-invalid={Boolean(weatherError)}>
        <SegmentedControl
          aria-describedby={weatherError ? "record-weather-error" : undefined}
          aria-invalid={Boolean(weatherError)}
          aria-labelledby="record-weather-label"
          name="weather"
          onValueChange={handleWeatherChange}
          size="large"
          value={weather}
        >
          {RECORD_WEATHER_OPTIONS.map((option) => (
            <SegmentedControlItem key={option.value} value={option.value}>
              {option.label}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
        <FieldError id="record-weather-error">{weatherError}</FieldError>
      </Field>
    </FieldSet>
  );
}
