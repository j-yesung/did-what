"use client";

import {
  createContext,
  memo,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DayButton,
  type DayButtonProps,
  DayPicker,
  type Modifiers,
  type MonthCaptionProps,
  type WeekProps,
  type WeeksProps,
} from "react-day-picker";
import { ko } from "react-day-picker/locale";

import { CaretDownIcon, CaretLeftIcon, CaretRightIcon, NotePencilIcon } from "@phosphor-icons/react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { AnimatePresence, motion, useIsPresent, usePresenceData, useReducedMotion } from "motion/react";
import { useSearchParams } from "next/navigation";

import {
  normalizeRecordCategory,
  RECORD_CATEGORY_FILL,
  type RecordSummary,
  recordCalendarQueryOptions,
  recordMonthBoundsQueryOptions,
} from "@/entities/record";
import { FOCUS_RING, PRESS_FEEDBACK } from "@/shared/lib/interaction";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { LiquidGlassButton } from "@/shared/ui/liquid-glass-button";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";

import {
  getCalendarDayAction,
  getCalendarHref,
  getCalendarMonthSummary,
  getCalendarRange,
  getTitleLines,
  getToday,
  getVisibleTitleCount,
  groupRecordsByDate,
  parseCalendarDate,
  parseCalendarMonth,
  shiftMonth,
} from "../model/record-calendar";
import { CalendarRecordCreateButton } from "./calendar-record-create-button";
import { RecordDayBottomSheet } from "./record-day-bottom-sheet";

// 칸 높이를 재기 전(서버 렌더링 포함)에 쓰는 제목 줄 수
const DEFAULT_TITLE_LINES = 2;
// 앞뒤 달도 미리 받아 버튼을 누른 직후 빈 달력이 잠깐 나타나지 않게 한다.
const MONTH_OFFSETS = [-1, 0, 1];
const CURRENT_MONTH_INDEX = 1;
const EMPTY_RECORDS_BY_DATE: ReadonlyMap<string, readonly RecordSummary[]> = new Map();
const MONTH_SLIDE_TRANSITION = { duration: 0.24, ease: [0.77, 0, 0.175, 1] } as const;
const MONTH_FADE_TRANSITION = { duration: 0.16, ease: [0.23, 1, 0.32, 1] } as const;

type RecordCalendarContextValue = {
  recordsByDate: ReadonlyMap<string, readonly RecordSummary[]>;
  titleLines: number;
};

const RecordCalendarContext = createContext<RecordCalendarContextValue>({
  recordsByDate: EMPTY_RECORDS_BY_DATE,
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
          className={cn(
            // 늦게 도착한 제목이 툭 튀어나오지 않게 짧게 페이드한다.
            "fade-in-0 h-4 shrink-0 animate-in overflow-hidden whitespace-nowrap rounded-lg px-1 text-[0.625rem] text-foreground leading-4 duration-150 motion-reduce:animate-none",
            RECORD_CATEGORY_FILL[normalizeRecordCategory(record.category)],
          )}
          key={record.id}
        >
          {record.activity}
        </span>
      ))}
      {/* 여러 기록을 묶은 표시라 어느 카테고리도 대표할 수 없다. */}
      {hiddenCount > 0 ? (
        <span className="h-4 shrink-0 rounded-lg bg-muted-foreground/15 px-1 text-[0.625rem] text-muted-foreground leading-4">
          +{hiddenCount}
        </span>
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

// 화면의 월 제목은 바깥 헤더가 맡으므로 라이브러리 캡션은 숨긴다.
function RecordMonthCaption({
  calendarMonth: _calendarMonth,
  displayIndex: _displayIndex,
  ...props
}: MonthCaptionProps) {
  return <div aria-hidden="true" {...props} />;
}

// 렌더마다 새 객체를 넘기면 DayPicker가 날짜 칸을 전부 다시 만들어 누름 반응과 포커스가 끊긴다.
const CALENDAR_COMPONENTS = {
  DayButton: RecordDayButton,
  MonthCaption: RecordMonthCaption,
  Week: RecordWeek,
  Weeks: RecordWeeks,
};

const CALENDAR_CLASS_NAMES = {
  day: "flex min-w-0 flex-1 basis-0 flex-col pt-1",
  month: "flex w-full flex-1 flex-col",
  month_caption: "pointer-events-none absolute size-px overflow-hidden opacity-0",
  month_grid: "flex flex-1 flex-col",
  months: "flex flex-1 flex-col",
  root: "flex w-full min-w-0 flex-1 flex-col",
  week: "flex flex-1 basis-0 border-t",
  weekday: "min-w-0 flex-1 basis-0 pb-2 text-center font-normal text-muted-foreground text-xs",
  weekdays: "flex",
  weeks: "flex flex-1 flex-col",
};

const SUMMARY_COUNT = "font-semibold text-foreground tabular-nums";

function CalendarMonthSummary({
  month,
  recordsByDate,
}: {
  month: string;
  recordsByDate: ReadonlyMap<string, readonly RecordSummary[]> | undefined;
}) {
  if (!recordsByDate) return null;

  const { recordCount, regionCount } = getCalendarMonthSummary(recordsByDate, month);
  if (recordCount === 0) return <p className="text-muted-foreground text-sm">아직 조용하네요</p>;

  return (
    <p className="text-muted-foreground text-sm">
      {regionCount > 0 ? (
        <>
          <span className={SUMMARY_COUNT}>{regionCount}</span>개 지역에서{" "}
        </>
      ) : null}
      <span className={SUMMARY_COUNT}>{recordCount}</span>번 함께했어요
    </p>
  );
}

const replaceCalendarHref = (month: string, date?: string | null) => {
  window.history.replaceState(window.history.state, "", getCalendarHref(month, date));
};

type CalendarMonthProps = {
  month: string;
  onDayClick: (date: Date, modifiers: Modifiers) => void;
  onMonthChange: (date: Date) => void;
  records: readonly RecordSummary[] | undefined;
  selectedDate: string | null;
  titleLines: number;
  today: string;
};

/** 한 달치 달력. 날짜 선택처럼 월 데이터가 바뀌지 않는 렌더에서는 다시 그리지 않는다. */
const CalendarMonth = memo(function CalendarMonth({
  month,
  onDayClick,
  onMonthChange,
  records,
  selectedDate,
  titleLines,
  today,
}: CalendarMonthProps) {
  const recordsByDate = useMemo(
    () => (records ? groupRecordsByDate(records, getCalendarRange(month)) : EMPTY_RECORDS_BY_DATE),
    [month, records],
  );
  const calendarContext = useMemo(() => ({ recordsByDate, titleLines }), [recordsByDate, titleLines]);

  return (
    <RecordCalendarContext.Provider value={calendarContext}>
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

function CalendarMonthSlide({ children, reduceMotion }: { children: ReactNode; reduceMotion: boolean }) {
  const isPresent = useIsPresent();
  const direction = (usePresenceData() as number | undefined) ?? 1;

  return (
    <motion.div
      animate={reduceMotion ? { opacity: 1 } : { transform: "translateX(0%)" }}
      aria-hidden={!isPresent}
      className="absolute inset-0 flex w-full min-w-0 flex-col"
      exit={reduceMotion ? { opacity: 0 } : { transform: `translateX(${-direction * 100}%)` }}
      initial={reduceMotion ? { opacity: 0 } : { transform: `translateX(${direction * 100}%)` }}
      inert={!isPresent}
      transition={reduceMotion ? MONTH_FADE_TRANSITION : MONTH_SLIDE_TRANSITION}
    >
      {children}
    </motion.div>
  );
}

export function RecordCalendar() {
  const searchParams = useSearchParams();
  const shouldReduceMotion = useReducedMotion();
  const today = getToday();
  const initialMonth = parseCalendarMonth(searchParams?.get("month"), today);
  const initialDate = parseCalendarDate(searchParams?.get("date"), initialMonth);
  const [month, setMonth] = useState(initialMonth);
  const [direction, setDirection] = useState(1);
  const [selectedDate, setSelectedDate] = useState<string | null>(initialDate);
  const [pendingDate, setPendingDate] = useState<string | null>(initialDate);
  const [open, setOpen] = useState(Boolean(initialDate));
  const [titleLines, setTitleLines] = useState(DEFAULT_TITLE_LINES);
  const viewportRef = useRef<HTMLDivElement>(null);

  const ranges = useMemo(() => MONTH_OFFSETS.map((offset) => getCalendarRange(shiftMonth(month, offset))), [month]);
  const monthQueries = useQueries({ queries: ranges.map((range) => recordCalendarQueryOptions(range)) });
  const monthBoundsQuery = useQuery(recordMonthBoundsQueryOptions);
  const recordsQuery = monthQueries[CURRENT_MONTH_INDEX];
  const range = ranges[CURRENT_MONTH_INDEX];
  const recordsByDate = useMemo(
    () => (recordsQuery.data ? groupRecordsByDate(recordsQuery.data, range) : undefined),
    [range, recordsQuery.data],
  );
  const isError = !recordsQuery.data && recordsQuery.isError;
  const selectableMonths = useMemo(() => {
    const firstMonth = [monthBoundsQuery.data?.firstMonth, month, today.slice(0, 7)]
      .filter((value): value is string => Boolean(value))
      .sort()[0];
    const lastMonth = [monthBoundsQuery.data?.lastMonth, month, today.slice(0, 7)]
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1)!;
    const months: string[] = [];
    for (let current = lastMonth; current >= firstMonth; current = shiftMonth(current, -1)) months.push(current);
    return months;
  }, [month, monthBoundsQuery.data, today]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    // 6주가 화면 높이를 나눠 가지므로 칸 높이는 기기마다 다르다. 들어가는 만큼만 제목을 보여준다.
    const observer = new ResizeObserver(() => {
      const button = viewport.querySelector("td button");
      if (!button) return;
      const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
      setTitleLines(getTitleLines(button.getBoundingClientRect().height, rootFontSize));
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  // 서버 요청과 이력 추가 없이 주소의 월만 바꿔 상세에서 돌아왔을 때 같은 달을 보여준다.
  const changeMonth = useCallback(
    (nextMonth: string, keepSelection = false) => {
      if (nextMonth !== month) setDirection(nextMonth > month ? 1 : -1);
      setMonth(nextMonth);
      if (!keepSelection) {
        setSelectedDate(null);
        setPendingDate(null);
        setOpen(false);
      }
      replaceCalendarHref(nextMonth);
    },
    [month],
  );

  // 아직 이번 달을 받지 못했으면 '기록 없음'인지 알 수 없다.
  const getDayRecords = useCallback(
    (date: string | null) => (date && recordsByDate ? (recordsByDate.get(date) ?? []) : undefined),
    [recordsByDate],
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

  /**
   * openDay는 보고 있는 달과 선택한 날짜에 매여 있어 렌더마다 새 함수가 된다.
   * 그대로 내려보내면 날짜 선택 때마다 memo가 풀려 달력 전체를 다시 그리므로 ref로 최신 것만 꺼내 쓴다.
   */
  const openDayRef = useRef(openDay);
  openDayRef.current = openDay;
  const handleDayClick = useCallback((date: Date, modifiers: Modifiers) => openDayRef.current(date, modifiers), []);
  const handleMonthChange = useCallback((date: Date) => changeMonth(format(date, "yyyy-MM")), [changeMonth]);

  useEffect(() => {
    if (!pendingDate) return;
    const records = getDayRecords(pendingDate);
    if (!records) return;

    setPendingDate(null);
    setOpen(records.length > 0);
    replaceCalendarHref(month, records.length > 0 ? pendingDate : null);
  }, [getDayRecords, month, pendingDate]);

  const handleBottomSheetOpenChange = (nextOpen: boolean) => {
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
        <h2 className="relative inline-flex min-w-0 items-center">
          <select
            aria-label="표시할 달 선택"
            className="h-11 max-w-full cursor-pointer appearance-none rounded-lg bg-transparent py-1 pr-7 pl-1 font-bold text-foreground text-xl tracking-[-0.03em] outline-none"
            onChange={(event) => changeMonth(event.target.value)}
            value={month}
          >
            {selectableMonths.map((optionMonth) => (
              <option key={optionMonth} value={optionMonth}>
                {format(parseISO(`${optionMonth}-01`), "yyyy년 M월")}
              </option>
            ))}
          </select>
          <CaretDownIcon aria-hidden="true" className="pointer-events-none absolute right-1 size-4" />
        </h2>
        <Button color="dark" onClick={() => changeMonth(today.slice(0, 7))} variant="weak">
          오늘
        </Button>
      </header>

      {isError ? (
        <LoadErrorAlert
          icon={<NotePencilIcon aria-hidden="true" />}
          onRetry={() => void recordsQuery.refetch()}
          retrying={recordsQuery.isFetching}
          title="기록을 불러오지 못했어요"
        />
      ) : null}

      <div className="relative flex w-full min-w-0 flex-1 overflow-hidden" ref={viewportRef}>
        <AnimatePresence custom={direction} initial={false}>
          <CalendarMonthSlide key={month} reduceMotion={Boolean(shouldReduceMotion)}>
            <CalendarMonth
              month={month}
              onDayClick={handleDayClick}
              onMonthChange={handleMonthChange}
              records={recordsQuery.data}
              selectedDate={selectedDate}
              titleLines={titleLines}
              today={today}
            />
          </CalendarMonthSlide>
        </AnimatePresence>
      </div>

      {createDate ? <div className="h-16 shrink-0" /> : null}
      <div className="flex h-24 shrink-0 flex-col items-center justify-center gap-2 pb-2">
        <div className="flex h-5 items-center justify-center text-center">
          {createDate ? null : <CalendarMonthSummary month={month} recordsByDate={recordsByDate} />}
        </div>
        <div aria-label="달 이동" className="flex w-full items-center justify-between" role="group">
          <LiquidGlassButton aria-label="이전 달" onClick={() => changeMonth(shiftMonth(month, -1))} shape="circle">
            <CaretLeftIcon aria-hidden="true" />
          </LiquidGlassButton>
          <LiquidGlassButton aria-label="다음 달" onClick={() => changeMonth(shiftMonth(month, 1))} shape="circle">
            <CaretRightIcon aria-hidden="true" />
          </LiquidGlassButton>
        </div>
      </div>

      <CalendarRecordCreateButton date={createDate} />

      <RecordDayBottomSheet
        date={selectedDate}
        isError={isError}
        onOpenChange={handleBottomSheetOpenChange}
        onRetry={() => void recordsQuery.refetch()}
        open={open}
        records={selectedRecords}
      />
    </section>
  );
}
