import type { Icon, IconProps } from "@phosphor-icons/react";
import { CloudIcon, CloudRainIcon, CloudSunIcon, SnowflakeIcon, SunIcon } from "@phosphor-icons/react/dist/ssr";

import type { RecordWeather } from "../model/weather";

const WEATHER_ICON: Record<RecordWeather, Icon> = {
  cloudy: CloudIcon,
  partly_cloudy: CloudSunIcon,
  rainy: CloudRainIcon,
  snowy: SnowflakeIcon,
  sunny: SunIcon,
};

type WeatherIconProps = IconProps & {
  weather: RecordWeather;
};

export function WeatherIcon({ weather, ...props }: WeatherIconProps) {
  const Icon = WEATHER_ICON[weather];
  return <Icon {...props} />;
}
