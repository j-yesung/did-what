"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  DayButton,
  type DayButtonProps,
  DayPicker,
  type Modifiers,
  type WeekProps,
  type WeeksProps,
} from "react-day-picker";
import { ko } from "react-day-picker/locale";

import { CaretLeftIcon, CaretRightIcon, NotePencilIcon } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { useSearchParams } from "next/navigation";

import { type RecordSummary, recordCalendarQueryOptions } from "@/entities/record";
import { FOCUS_RING, PRESS_FEEDBACK } from "@/shared/lib/interaction";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { IconButton } from "@/shared/ui/icon-button";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";

import {
  getCalendarDayAction,
  getCalendarHref,
  getCalendarRange,
  getOverlapRange,
  getTitleLines,
  getToday,
  getVisibleTitleCount,
  groupRecordsByDate,
  parseCalendarDate,
  parseCalendarMonth,
  shiftMonth,
} from "../model/record-calendar";
import { CalendarRecordCreateButton } from "./calendar-record-create-button";
import { RecordDayDrawer } from "./record-day-drawer";

// 칸 높이를 재기 전(서버 렌더링 포함)에 쓰는 제목 줄 수
const DEFAULT_TITLE_LINES = 2;

type RecordCalendarContextValue = {
  recordsByDate: ReadonlyMap<string, readonly RecordSummary[]>;
  titleLines: number;
};

const RecordCalendarContext = createContext<RecordCalendarContextValue>({
  recordsByDate: new Map(),
  titleLines: DEFAULT_TITLE_LINES,
});

/**
 * 셀 전체가 날짜 버튼 하나다. 제목 띠는 보여주기만 하고 누를 수 없다.
 * 라이브러리 DayButton으로 감싸 키보드 이동 때의 포커스 처리를 그대로 쓴다.
 */
function RecordDayButton({ children, day, modifiers, ...props }: DayButtonProps) {
  const { recordsByDate, titleLines } = useContext(RecordCalendarContext);
  const records = recordsByDate.get(day.isoDate) ?? [];
  const visibleCount = getVisibleTitleCount(records.length, titleLines);
  const hiddenCount = records.length - visibleCount;

  return (
    <DayButton
      {...props}
      aria-label={records.length > 0 ? `${props["aria-label"]}, 기록 ${records.length}개` : props["aria-label"]}
      className={cn(
        // 최소 높이는 날짜 숫자와 제목 한 줄이 들어가는 만큼이다(getTitleLines와 같은 계산).
        "flex min-h-11.25 w-full min-w-0 flex-1 cursor-pointer flex-col gap-px overflow-hidden rounded-lg px-0.5 pt-1 text-left after:inset-0",
        PRESS_FEEDBACK,
        FOCUS_RING,
      )}
      day={day}
      modifiers={modifiers}
    >
      <span
        className={cn(
          "mx-auto flex size-6 shrink-0 items-center justify-center rounded-full text-sm tabular-nums",
          modifiers.outside && "text-muted-foreground",
          // 파란 글자는 다크 배경에서 대비가 모자라 오늘은 테두리로만 표시한다.
          modifiers.today && "font-semibold ring-1 ring-primary",
          modifiers.selected && "bg-primary font-semibold text-primary-foreground ring-0",
        )}
      >
        {children}
      </span>
      {records.slice(0, visibleCount).map((record) => (
        <span
          // 늦게 도착한 제목이 툭 튀어나오지 않게 짧게 페이드한다.
          className="fade-in-0 h-4 shrink-0 animate-in overflow-hidden whitespace-nowrap rounded-[0.25rem] bg-primary/20 px-1 text-[0.625rem] text-foreground leading-4 duration-150 motion-reduce:animate-none"
          key={record.id}
        >
          {record.activity}
        </span>
      ))}
      {hiddenCount > 0 ? (
        <span className="h-4 shrink-0 px-1 text-[0.625rem] text-muted-foreground leading-4">+{hiddenCount}</span>
      ) : null}
    </DayButton>
  );
}

/**
 * 달력이 하단 내비게이션 앞까지 남는 높이를 채우도록 표를 flex로 배치한다.
 * 표 요소의 display를 바꾸면 Safari가 행 의미를 지우는 경우가 있어 역할을 직접 적는다.
 */
function RecordWeeks(props: WeeksProps) {
  return <tbody role="rowgroup" {...props} />;
}

function RecordWeek({ week: _week, ...props }: WeekProps) {
  return <tr role="row" {...props} />;
}

// 렌더마다 새 객체를 넘기면 DayPicker가 날짜 칸을 전부 다시 만들어 누름 반응과 포커스가 끊긴다.
const CALENDAR_COMPONENTS = { DayButton: RecordDayButton, Week: RecordWeek, Weeks: RecordWeeks };

// 주는 남는 높이를 똑같이 나눠 갖고, 칸은 제목이 길어도 7등분 너비를 넘지 않는다.
const CALENDAR_CLASS_NAMES = {
  day: "flex min-w-0 flex-1 basis-0 flex-col pt-1",
  month: "flex flex-1 flex-col",
  month_caption: "hidden",
  month_grid: "flex flex-1 flex-col",
  months: "flex flex-1 flex-col",
  root: "flex flex-1 flex-col",
  week: "flex flex-1 basis-0 border-t",
  weekday: "min-w-0 flex-1 basis-0 pb-2 text-center font-normal text-muted-foreground text-xs",
  weekdays: "flex",
  weeks: "flex flex-1 flex-col",
};

const replaceCalendarHref = (month: string, date?: string | null) => {
  window.history.replaceState(window.history.state, "", getCalendarHref(month, date));
};

export function RecordCalendar() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const today = getToday();
  const initialMonth = parseCalendarMonth(searchParams?.get("month"), today);
  const initialDate = parseCalendarDate(searchParams?.get("date"), initialMonth);
  const [month, setMonth] = useState(initialMonth);
  const [selectedDate, setSelectedDate] = useState<string | null>(initialDate);
  const [pendingDate, setPendingDate] = useState<string | null>(initialDate);
  const [open, setOpen] = useState(Boolean(initialDate));
  const [titleLines, setTitleLines] = useState(DEFAULT_TITLE_LINES);
  // 마지막으로 기록을 받아 둔 달. 새 달을 받는 동안 겹치는 날짜를 이 달의 기록으로 채운다.
  const [loadedMonth, setLoadedMonth] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const range = useMemo(() => getCalendarRange(month), [month]);
  const recordsQuery = useQuery(recordCalendarQueryOptions(range));
  const overlapRange = useMemo(
    () => (loadedMonth ? getOverlapRange(range, getCalendarRange(loadedMonth)) : null),
    [loadedMonth, range],
  );
  const overlapRecords =
    !recordsQuery.data && loadedMonth && overlapRange
      ? queryClient.getQueryData(recordCalendarQueryOptions(getCalendarRange(loadedMonth)).queryKey)
      : undefined;
  const recordsByDate = useMemo(
    () =>
      recordsQuery.data
        ? groupRecordsByDate(recordsQuery.data, range)
        : overlapRecords && overlapRange
          ? groupRecordsByDate(overlapRecords, overlapRange)
          : new Map<string, RecordSummary[]>(),
    [overlapRange, overlapRecords, recordsQuery.data, range],
  );
  const isError = !recordsQuery.data && recordsQuery.isError;
  const calendarContext = useMemo(() => ({ recordsByDate, titleLines }), [recordsByDate, titleLines]);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    // 6주가 화면 높이를 나눠 가지므로 칸 높이는 기기마다 다르다. 들어가는 만큼만 제목을 보여준다.
    const observer = new ResizeObserver(() => {
      const button = grid.querySelector("td button");
      if (!button) return;
      const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
      setTitleLines(getTitleLines(button.getBoundingClientRect().height, rootFontSize));
    });
    observer.observe(grid);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!recordsQuery.isSuccess) return;
    // 보고 있는 월을 받은 뒤에만 앞뒤 한 달을 미리 받는다. 미리 받은 월을 기준으로 이어서 받지는 않는다.
    for (const amount of [-1, 1]) {
      void queryClient.prefetchQuery(recordCalendarQueryOptions(getCalendarRange(shiftMonth(month, amount))));
    }
  }, [month, queryClient, recordsQuery.isSuccess]);

  // 서버 요청과 이력 추가 없이 주소의 월만 바꿔 상세에서 돌아왔을 때 같은 달을 보여준다.
  const changeMonth = (nextMonth: string, keepSelection = false) => {
    if (recordsQuery.data) setLoadedMonth(month);
    setMonth(nextMonth);
    if (!keepSelection) {
      setSelectedDate(null);
      setPendingDate(null);
      setOpen(false);
    }
    replaceCalendarHref(nextMonth);
  };

  // 누르는 순간 그다음 달까지 받아 두어 연달아 넘겨도 받아 둔 달이 이어진다.
  const prefetchAhead = (amount: number) => {
    for (const step of [amount, amount * 2]) {
      void queryClient.prefetchQuery(recordCalendarQueryOptions(getCalendarRange(shiftMonth(month, step))));
    }
  };

  // 새 달을 받는 중이면 이전 달과 겹치는 날짜만 알 수 있다. 나머지 날짜에 '기록 없음'을 보여주면 안 된다.
  const getDayRecords = useCallback(
    (date: string | null) => {
      if (!date) return undefined;
      const known =
        recordsQuery.data || (overlapRecords && overlapRange && overlapRange.from <= date && date <= overlapRange.to);
      return known ? (recordsByDate.get(date) ?? []) : undefined;
    },
    [overlapRange, overlapRecords, recordsByDate, recordsQuery.data],
  );

  const openDay = (date: Date, modifiers: Modifiers) => {
    const nextDate = format(date, "yyyy-MM-dd");
    const action = getCalendarDayAction(getDayRecords(nextDate), selectedDate === nextDate && !open);
    const nextMonth = modifiers.outside ? format(date, "yyyy-MM") : month;

    if (modifiers.outside) changeMonth(nextMonth, true);

    if (action === "clear") {
      setSelectedDate(null);
      replaceCalendarHref(nextMonth);
      return;
    }

    setSelectedDate(nextDate);
    setPendingDate(action === "wait" ? nextDate : null);
    setOpen(action === "open" || action === "wait");
    replaceCalendarHref(nextMonth, action === "open" || action === "wait" ? nextDate : null);
  };

  useEffect(() => {
    if (!pendingDate) return;
    const records = getDayRecords(pendingDate);
    if (!records) return;

    setPendingDate(null);
    setOpen(records.length > 0);
    replaceCalendarHref(month, records.length > 0 ? pendingDate : null);
  }, [getDayRecords, month, pendingDate]);

  const handleDrawerOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) return;
    setSelectedDate(null);
    setPendingDate(null);
    replaceCalendarHref(month);
  };

  const selectedRecords = getDayRecords(selectedDate);
  const createDate = !open && selectedRecords?.length === 0 ? selectedDate : null;

  return (
    <section className="relative flex flex-1 flex-col gap-2">
      <header className="flex items-center justify-between gap-2 pl-1">
        <h2 aria-live="polite" className="font-bold text-xl tracking-[-0.03em]">
          {format(parseISO(`${month}-01`), "yyyy년 M월")}
        </h2>
        <div className="-mr-2 flex items-center gap-1">
          <Button color="dark" onClick={() => changeMonth(today.slice(0, 7))} variant="weak">
            오늘
          </Button>
          <IconButton
            aria-label="이전 달"
            icon={CaretLeftIcon}
            onClick={() => changeMonth(shiftMonth(month, -1))}
            onPointerDown={() => prefetchAhead(-1)}
          />
          <IconButton
            aria-label="다음 달"
            icon={CaretRightIcon}
            onClick={() => changeMonth(shiftMonth(month, 1))}
            onPointerDown={() => prefetchAhead(1)}
          />
        </div>
      </header>

      {isError ? (
        <LoadErrorAlert icon={<NotePencilIcon aria-hidden="true" />} title="기록을 불러오지 못했어요" />
      ) : null}

      <RecordCalendarContext.Provider value={calendarContext}>
        <div className="flex flex-1 flex-col" ref={gridRef}>
          <DayPicker
            classNames={CALENDAR_CLASS_NAMES}
            components={CALENDAR_COMPONENTS}
            fixedWeeks
            hideNavigation
            locale={ko}
            modifiers={{ selected: selectedDate ? parseISO(selectedDate) : false }}
            month={parseISO(`${month}-01`)}
            onDayClick={openDay}
            onMonthChange={(date) => changeMonth(format(date, "yyyy-MM"))}
            showOutsideDays
            today={parseISO(today)}
          />
        </div>
      </RecordCalendarContext.Provider>

      <CalendarRecordCreateButton date={createDate} />

      <RecordDayDrawer
        date={selectedDate}
        isError={isError}
        onOpenChange={handleDrawerOpenChange}
        open={open}
        records={selectedRecords}
      />
    </section>
  );
}
