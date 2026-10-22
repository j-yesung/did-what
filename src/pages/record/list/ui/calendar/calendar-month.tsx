"use client";

import { createContext, memo, useContext, useMemo } from "react";
import {
  DayButton,
  type DayButtonProps,
  DayPicker,
  type MonthCaptionProps,
  type WeekProps,
  type WeeksProps,
} from "react-day-picker";
import { ko } from "react-day-picker/locale";

import { parseISO } from "date-fns";

import { normalizeRecordCategory, RECORD_CATEGORY_FILL, type RecordSummary } from "@/entities/record";
import { FOCUS_RING, PRESS_FEEDBACK } from "@/shared/lib/interaction";
import { cn } from "@/shared/lib/utils";

import { getCalendarRange, getCalendarWeekLayout, groupRecordsByDate } from "../../model/record-calendar";

const TITLE_LINES = 1;
const EMPTY_RECORDS_BY_DATE: ReadonlyMap<string, readonly RecordSummary[]> = new Map();
const EMPTY_HIDDEN_COUNTS: ReadonlyMap<string, number> = new Map();

const RecordCalendarContext = createContext(EMPTY_RECORDS_BY_DATE);
const RecordWeekContext = createContext(EMPTY_HIDDEN_COUNTS);

function RecordDayButton({ children, day, modifiers, ...props }: DayButtonProps) {
  const recordsByDate = useContext(RecordCalendarContext);
  const hiddenCount = useContext(RecordWeekContext).get(day.isoDate) ?? 0;
  const records = recordsByDate.get(day.isoDate) ?? [];

  return (
    <DayButton
      {...props}
      aria-label={
        records.length > 0
          ? `${props["aria-label"]}, 기록 ${records.length}개, ${records.map((record) => record.activity).join(", ")}`
          : props["aria-label"]
      }
      className={cn(
        "flex w-full min-w-0 flex-1 cursor-pointer flex-col items-center rounded-lg pt-0.5 after:inset-0",
        PRESS_FEEDBACK,
        FOCUS_RING,
      )}
      day={day}
      modifiers={modifiers}
    >
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full text-sm tabular-nums",
          modifiers.outside && "text-muted-foreground",
          modifiers.today && "font-semibold ring-1 ring-primary",
          modifiers.selected && "bg-primary font-semibold text-primary-foreground ring-0",
        )}
      >
        {children}
      </span>
      {hiddenCount > 0 ? (
        <span
          aria-hidden="true"
          className="absolute top-1 right-0.5 text-[0.5625rem] text-muted-foreground tabular-nums leading-none"
        >
          +{hiddenCount}
        </span>
      ) : null}
    </DayButton>
  );
}

function RecordWeeks(props: WeeksProps) {
  return <tbody role="rowgroup" {...props} />;
}

function RecordWeek({ week, children, ...props }: WeekProps) {
  const recordsByDate = useContext(RecordCalendarContext);
  const dates = useMemo(() => week.days.map((day) => day.isoDate), [week]);
  const layout = useMemo(() => getCalendarWeekLayout(recordsByDate, dates, TITLE_LINES), [dates, recordsByDate]);
  const hiddenCounts = useMemo(
    () => new Map(dates.map((date, index) => [date, layout.hiddenCounts[index]])),
    [dates, layout],
  );
  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];

  return (
    <RecordWeekContext.Provider value={hiddenCounts}>
      <tr role="row" {...props}>
        {children}

        <td
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-6.75 grid auto-rows-[1rem] grid-cols-7 gap-y-px"
          colSpan={7}
          role="presentation"
        >
          {layout.segments.map(({ record, start, end, lane }) => (
            <span
              className={cn(
                "fade-in-0 mx-0.5 min-w-0 animate-in truncate rounded-sm px-1 text-[0.625rem] text-foreground leading-4 duration-150 motion-reduce:animate-none",
                RECORD_CATEGORY_FILL[normalizeRecordCategory(record.category)],
                record.recorded_at < firstDate && "ml-0 rounded-l-none",
                (record.recorded_until ?? record.recorded_at) > lastDate && "mr-0 rounded-r-none",
                week.days.slice(start, end + 1).every((day) => day.outside) && "opacity-40",
              )}
              key={record.id}
              style={{ gridColumn: `${start + 1} / span ${end - start + 1}`, gridRow: lane + 1 }}
            >
              {record.activity}
            </span>
          ))}
        </td>
      </tr>
    </RecordWeekContext.Provider>
  );
}

function RecordMonthCaption({
  calendarMonth: _calendarMonth,
  displayIndex: _displayIndex,
  ...props
}: MonthCaptionProps) {
  return <div aria-hidden="true" {...props} />;
}

const CALENDAR_COMPONENTS = {
  DayButton: RecordDayButton,
  MonthCaption: RecordMonthCaption,
  Week: RecordWeek,
  Weeks: RecordWeeks,
};

const CALENDAR_CLASS_NAMES = {
  day: "flex min-w-0 flex-1 basis-0 flex-col",
  month: "flex w-full flex-col",
  month_caption: "pointer-events-none absolute size-px overflow-hidden opacity-0",
  month_grid: "flex flex-col",
  months: "flex flex-col",
  root: "flex w-full min-w-0 flex-col",
  week: "relative flex h-11.5 border-t",
  weekday: "min-w-0 flex-1 basis-0 pb-1.5 text-center font-normal text-muted-foreground text-xs",
  weekdays: "flex",
  weeks: "flex flex-col",
};

type CalendarMonthProps = {
  month: string;
  onDayClick: (date: Date) => void;
  onMonthChange: (date: Date) => void;
  records: readonly RecordSummary[] | undefined;
  selectedDate: string | null;
  today: string;
};

export const CalendarMonth = memo(function CalendarMonth({
  month,
  onDayClick,
  onMonthChange,
  records,
  selectedDate,
  today,
}: CalendarMonthProps) {
  const recordsByDate = useMemo(
    () => (records ? groupRecordsByDate(records, getCalendarRange(month)) : EMPTY_RECORDS_BY_DATE),
    [month, records],
  );

  return (
    <RecordCalendarContext.Provider value={recordsByDate}>
      <DayPicker
        classNames={CALENDAR_CLASS_NAMES}
        components={CALENDAR_COMPONENTS}
        fixedWeeks
        hideNavigation
        locale={ko}
        modifiers={{ selected: selectedDate ? parseISO(selectedDate) : false }}
        month={parseISO(`${month}-01`)}
        onDayClick={onDayClick}
        onMonthChange={onMonthChange}
        showOutsideDays
        today={parseISO(today)}
      />
    </RecordCalendarContext.Provider>
  );
});
