"use client";

import { useState } from "react";

import { getDaysInMonth } from "date-fns";

import { getToday } from "@/shared/lib/date/get-today";
import { FOCUS_RING, PRESS_FEEDBACK } from "@/shared/lib/interaction";
import { cn } from "@/shared/lib/utils";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { FieldError } from "@/shared/ui/field";
import { Switch } from "@/shared/ui/switch";
import { WheelPicker, WheelPickerGroup } from "@/shared/ui/wheel-picker";

const FIRST_YEAR = 1970;
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

type DateKey = "recordedAt" | "recordedUntil";

type RecordDateFieldProps = {
  initialRecordedAt: string;
  initialRecordedUntil?: string | null;
  onValueChange?: (recordedAt: string, recordedUntil: string) => void;
  recordedAtError?: string;
  recordedUntilError?: string;
};

const range = (from: number, to: number, label: string) =>
  Array.from({ length: to - from + 1 }, (_, index) => ({ label: `${from + index}${label}`, value: from + index }));

const toIsoDate = (year: number, month: number, day: number) =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const formatCardDate = (date: string, today: string) => {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return `${date.slice(0, 4) === today.slice(0, 4) ? "" : `${year}년 `}${month}월 ${day}일 (${weekday})`;
};

export function RecordDateField({
  initialRecordedAt,
  initialRecordedUntil,
  onValueChange,
  recordedAtError,
  recordedUntilError,
}: RecordDateFieldProps) {
  const today = getToday();
  const [recordedAt, setRecordedAt] = useState(initialRecordedAt || today);
  const [recordedUntil, setRecordedUntil] = useState(initialRecordedUntil || initialRecordedAt || today);
  const [isSingleDay, setIsSingleDay] = useState(recordedUntil === recordedAt);
  const [active, setActive] = useState<DateKey>("recordedAt");
  const editing: DateKey = isSingleDay ? "recordedAt" : active;
  const [year, month, day] = (editing === "recordedAt" ? recordedAt : recordedUntil).split("-").map(Number);

  const commit = (nextRecordedAt: string, nextRecordedUntil: string) => {
    setRecordedAt(nextRecordedAt);
    setRecordedUntil(nextRecordedUntil);
    onValueChange?.(nextRecordedAt, nextRecordedUntil);
  };

  const changeDate = (next: { day?: number; month?: number; year?: number }) => {
    const nextYear = next.year ?? year;
    const nextMonth = next.month ?? month;
    const date = toIsoDate(
      nextYear,
      nextMonth,
      Math.min(next.day ?? day, getDaysInMonth(new Date(nextYear, nextMonth - 1))),
    );
    if (editing === "recordedAt") commit(date, isSingleDay || recordedUntil < date ? date : recordedUntil);
    else commit(recordedAt, date < recordedAt ? recordedAt : date);
  };

  const handleSingleDayChange = (checked: boolean) => {
    setIsSingleDay(checked);
    setActive(checked ? "recordedAt" : "recordedUntil");
    if (checked) commit(recordedAt, recordedAt);
  };

  const cards: { date: string; key: DateKey; label: string }[] = isSingleDay
    ? [{ date: recordedAt, key: "recordedAt", label: "기록한 날" }]
    : [
        { date: recordedAt, key: "recordedAt", label: "첫날" },
        { date: recordedUntil, key: "recordedUntil", label: "마지막 날" },
      ];
  const error = recordedAtError || recordedUntilError;

  return (
    <div aria-label="날짜" role="group">
      <div className="flex items-center justify-between gap-3">
        <BottomSheet.Title className="font-bold text-xl">언제였나요?</BottomSheet.Title>
        <label
          className="flex cursor-pointer items-center gap-2 text-muted-foreground text-sm"
          htmlFor="record-single-day"
        >
          하루 기록
          <Switch checked={isSingleDay} id="record-single-day" onCheckedChange={handleSingleDayChange} />
        </label>
      </div>
      <div className={cn("mt-4 grid gap-2", !isSingleDay && "grid-cols-2")}>
        {cards.map(({ date, key, label }) => {
          const selected = editing === key;
          const invalid = (key === "recordedAt" && recordedAtError) || (key === "recordedUntil" && recordedUntilError);
          const content = (
            <>
              <span className={cn("block text-muted-foreground text-xs", selected && "text-accent-text")}>{label}</span>
              <span className="mt-0.5 block font-bold text-base">{formatCardDate(date, today)}</span>
            </>
          );
          const cardClassName = cn(
            "inset-ring-[1.5px] inset-ring-transparent rounded-xl bg-muted px-3.5 py-3 text-left",
            selected && "inset-ring-primary bg-primary/12",
            invalid && "inset-ring-destructive",
          );
          return isSingleDay ? (
            <div className={cardClassName} key={key}>
              {content}
            </div>
          ) : (
            <button
              aria-pressed={selected}
              className={cn(
                cardClassName,
                "transition-[background-color,box-shadow] duration-200",
                PRESS_FEEDBACK,
                "after:hidden",
                FOCUS_RING,
              )}
              key={key}
              onClick={() => setActive(key)}
              type="button"
            >
              {content}
            </button>
          );
        })}
      </div>
      {error ? <FieldError className="mt-2">{error}</FieldError> : null}
      <WheelPickerGroup
        aria-label={editing === "recordedAt" ? (isSingleDay ? "기록한 날" : "첫날") : "마지막 날"}
        className="mt-3"
      >
        <WheelPicker
          aria-label="연도"
          className="flex-[1.3]"
          onValueChange={(value) => changeDate({ year: value })}
          options={range(FIRST_YEAR, Number(today.slice(0, 4)) + 1, "년")}
          value={year}
        />
        <WheelPicker
          aria-label="월"
          infinite
          onValueChange={(value) => changeDate({ month: value })}
          options={range(1, 12, "월")}
          value={month}
        />
        <WheelPicker
          aria-label="일"
          infinite
          onValueChange={(value) => changeDate({ day: value })}
          options={range(1, getDaysInMonth(new Date(year, month - 1)), "일")}
          value={day}
        />
      </WheelPickerGroup>
    </div>
  );
}
