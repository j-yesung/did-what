"use client";

import { type ReactNode, useLayoutEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";

import { WheelPicker as WheelPickerPrimitive, WheelPickerWrapper } from "@ncdai/react-wheel-picker";

import { getToday } from "@/shared/lib/date/get-today";
import { cn } from "@/shared/lib/utils";

type WheelOption = { label: string; value: number };

type WheelPickerProps = {
  "aria-label": string;
  className?: string;
  infinite?: boolean;
  onValueChange: (value: number) => void;
  options: WheelOption[];
  value: number;
};

const WHEEL_CLASS_NAMES = {
  highlightItem: "font-bold text-[19px] tabular-nums",
  highlightWrapper: "bg-muted text-foreground",
  optionItem: "font-semibold text-[19px] text-muted-foreground tabular-nums",
};

const FIRST_YEAR = 1970;

export const toWheelOptions = (from: number, to: number, unit: string): WheelOption[] =>
  Array.from({ length: to - from + 1 }, (_, index) => ({ label: `${from + index}${unit}`, value: from + index }));

const daysInMonth = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate();

const toIsoDate = (year: number, month: number, day: number) =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

export function WheelPicker({
  "aria-label": ariaLabel,
  className,
  infinite,
  onValueChange,
  options,
  value,
}: WheelPickerProps) {
  const latestValue = useRef(value);
  const [mountKey, setMountKey] = useState(0);

  useLayoutEffect(() => {
    latestValue.current = value;
  });

  const handleValueChange = (next: number) => {
    flushSync(() => onValueChange(next));
    if (latestValue.current !== next) setMountKey((key) => key + 1);
  };

  return (
    <div aria-label={ariaLabel} className={cn("flex min-w-0 flex-1", className)} data-slot="wheel-picker" role="group">
      <WheelPickerPrimitive
        classNames={WHEEL_CLASS_NAMES}
        infinite={infinite}
        key={mountKey}
        onValueChange={handleValueChange}
        optionItemHeight={40}
        options={options}
        value={value}
        visibleCount={16}
      />
    </div>
  );
}

export function WheelPickerGroup({
  "aria-label": ariaLabel,
  announcement,
  children,
  className,
}: {
  "aria-label": string;
  announcement: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div aria-label={ariaLabel} data-base-ui-swipe-ignore="" role="group">
      <WheelPickerWrapper
        className={cn(
          "[&>[data-slot=wheel-picker]:first-child_[data-rwp-highlight-wrapper]]:rounded-l-xl [&>[data-slot=wheel-picker]:last-child_[data-rwp-highlight-wrapper]]:rounded-r-xl [&_[data-rwp-highlight-wrapper]]:rounded-none [&_[data-rwp]]:[mask-image:linear-gradient(transparent,black_30%,black_70%,transparent)]",
          className,
        )}
      >
        {children}
      </WheelPickerWrapper>
      <span aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </div>
  );
}

type DateWheelPickerProps = {
  "aria-label": string;
  className?: string;
  max?: string;
  onValueChange: (date: string) => void;
  value: string;
};

export function DateWheelPicker({
  "aria-label": ariaLabel,
  className,
  max,
  onValueChange,
  value,
}: DateWheelPickerProps) {
  const [year, month, day] = value.split("-").map(Number);
  const [maxYear, maxMonth, maxDay] = (max ?? "").split("-").map(Number);
  const lastYear = max ? maxYear : Number(getToday().slice(0, 4)) + 1;
  const lastMonth = max && year === maxYear ? maxMonth : 12;
  const lastDay = max && year === maxYear && month === maxMonth ? maxDay : daysInMonth(year, month);

  const yearOptions = useMemo(() => toWheelOptions(FIRST_YEAR, lastYear, "년"), [lastYear]);
  const monthOptions = useMemo(() => toWheelOptions(1, lastMonth, "월"), [lastMonth]);
  const dayOptions = useMemo(() => toWheelOptions(1, lastDay, "일"), [lastDay]);

  const change = (next: { day?: number; month?: number; year?: number }) => {
    const nextYear = next.year ?? year;
    const nextMonth = next.month ?? month;
    const date = toIsoDate(nextYear, nextMonth, Math.min(next.day ?? day, daysInMonth(nextYear, nextMonth)));
    onValueChange(max && date > max ? max : date);
  };

  return (
    <WheelPickerGroup aria-label={ariaLabel} announcement={`${year}년 ${month}월 ${day}일`} className={className}>
      <WheelPicker
        aria-label="연도"
        className="flex-[1.3]"
        onValueChange={(nextYear) => change({ year: nextYear })}
        options={yearOptions}
        value={year}
      />
      <WheelPicker
        aria-label="월"
        infinite
        onValueChange={(nextMonth) => change({ month: nextMonth })}
        options={monthOptions}
        value={month}
      />
      <WheelPicker
        aria-label="일"
        infinite
        onValueChange={(nextDay) => change({ day: nextDay })}
        options={dayOptions}
        value={day}
      />
    </WheelPickerGroup>
  );
}
