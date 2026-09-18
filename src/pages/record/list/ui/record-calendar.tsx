"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
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
import { flushSync } from "react-dom";

import { CaretLeftIcon, CaretRightIcon, NotePencilIcon } from "@phosphor-icons/react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { animate, motion, type PanInfo, useMotionValue, useReducedMotion } from "motion/react";
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
  getCalendarSwipeMonthShift,
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
// 앞뒤 한 달을 함께 그려 두어야 손가락을 따라 옆 달이 딸려 나온다.
const MONTH_OFFSETS = [-1, 0, 1];
const CURRENT_MONTH_INDEX = 1;
// 손가락 속도를 그대로 이어받으므로 스프링에서 되튐을 더 주지는 않는다.
const SNAP_SPRING = { bounce: 0, type: "spring", visualDuration: 0.25 } as const;

const EMPTY_RECORDS_BY_DATE: ReadonlyMap<string, readonly RecordSummary[]> = new Map();

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
          // 늦게 도착한 제목이 툭 튀어나오지 않게 짧게 페이드한다.
          className="fade-in-0 h-4 shrink-0 animate-in overflow-hidden whitespace-nowrap rounded-lg bg-primary/20 px-1 text-[0.625rem] text-foreground leading-4 duration-150 motion-reduce:animate-none"
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

// 주는 남는 높이를 똑같이 나눠 갖고, 칸은 제목이 길어도 7등분 너비를 넘지 않는다.
const CALENDAR_CLASS_NAMES = {
  day: "flex min-w-0 flex-1 basis-0 flex-col pt-1",
  month: "flex w-full flex-1 flex-col",
  month_caption: "pointer-events-none absolute size-px overflow-hidden opacity-0",
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

type CalendarMonthProps = {
  isCurrent: boolean;
  month: string;
  onDayClick: (date: Date, modifiers: Modifiers) => void;
  onMonthChange: (date: Date) => void;
  records: readonly RecordSummary[] | undefined;
  selectedDate: string | null;
  titleLines: number;
  today: string;
};

/** 한 달치 달력. 화면 밖의 앞뒤 달은 inert로 빼 낭독기와 탭 이동에서 달력이 셋으로 보이지 않게 한다. */
function CalendarMonth({
  isCurrent,
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
      <div className="flex w-1/3 shrink-0 flex-col" inert={!isCurrent}>
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
      </div>
    </RecordCalendarContext.Provider>
  );
}

export function RecordCalendar() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const shouldReduceMotion = useReducedMotion();
  const today = getToday();
  const initialMonth = parseCalendarMonth(searchParams?.get("month"), today);
  const initialDate = parseCalendarDate(searchParams?.get("date"), initialMonth);
  const [month, setMonth] = useState(initialMonth);
  const [selectedDate, setSelectedDate] = useState<string | null>(initialDate);
  const [pendingDate, setPendingDate] = useState<string | null>(initialDate);
  const [open, setOpen] = useState(Boolean(initialDate));
  const [titleLines, setTitleLines] = useState(DEFAULT_TITLE_LINES);
  const viewportRef = useRef<HTMLDivElement>(null);
  const didSwipeRef = useRef(false);
  // 달 하나 너비를 0으로 두고, 손가락을 따라가는 어긋남만 담는다.
  const x = useMotionValue(0);

  const months = useMemo(() => MONTH_OFFSETS.map((offset) => shiftMonth(month, offset)), [month]);
  const ranges = useMemo(() => months.map((value) => getCalendarRange(value)), [months]);
  const monthQueries = useQueries({ queries: ranges.map((range) => recordCalendarQueryOptions(range)) });
  const recordsQuery = monthQueries[CURRENT_MONTH_INDEX];
  const recordsByDate = useMemo(
    () => (recordsQuery.data ? groupRecordsByDate(recordsQuery.data, ranges[CURRENT_MONTH_INDEX]) : undefined),
    [ranges, recordsQuery.data],
  );
  const isError = !recordsQuery.data && recordsQuery.isError;

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
  const changeMonth = (nextMonth: string, keepSelection = false) => {
    setMonth(nextMonth);
    if (!keepSelection) {
      setSelectedDate(null);
      setPendingDate(null);
      setOpen(false);
    }
    replaceCalendarHref(nextMonth);
  };

  /**
   * 손을 뗀 자리에서 그대로 이어지도록 달을 먼저 바꾸고, 바뀐 만큼 좌표를 되돌린 뒤 0으로 붙인다.
   * 전환 중에 또 넘겨도 바로 앞 전환이 이미 확정돼 있어 어긋나지 않는다.
   */
  const settleMonth = (amount: number, velocity = 0) => {
    if (amount !== 0) {
      const offsetX = x.get();
      const width = viewportRef.current?.offsetWidth ?? 0;
      // 달이 바뀌는 순간과 좌표 보정이 같은 프레임에 끝나야 한 프레임 튐이 없다.
      flushSync(() => changeMonth(shiftMonth(month, amount)));
      // set으로 옮기면 한 달 너비만큼의 순간 이동을 속도로 읽어 스프링이 튀어 나간다. jump은 속도 기록을 지운다.
      x.jump(offsetX + amount * width);
    }
    // 손가락이 가던 속도를 이어받아야 놓는 순간에 한 번 멈췄다 다시 가는 느낌이 없다.
    animate(x, 0, shouldReduceMotion ? { duration: 0 } : { ...SNAP_SPRING, velocity });
  };

  // 누르는 순간 그다음 달까지 받아 두어 연달아 넘겨도 받아 둔 달이 이어진다. 앞뒤 한 달은 이미 그리면서 받는다.
  const prefetchAhead = (amount: number) => {
    void queryClient.prefetchQuery(recordCalendarQueryOptions(getCalendarRange(shiftMonth(month, amount * 2))));
  };

  const handleDragEnd = (_event: PointerEvent, info: PanInfo) => {
    settleMonth(getCalendarSwipeMonthShift(info.offset.x, info.velocity.x), info.velocity.x);
    // 드래그 끝에 딸려 오는 click 한 번만 흘려보낸다.
    window.setTimeout(() => {
      didSwipeRef.current = false;
    }, 0);
  };

  // 아직 이번 달을 받지 못했으면 '기록 없음'인지 알 수 없다.
  const getDayRecords = useCallback(
    (date: string | null) => (date && recordsByDate ? (recordsByDate.get(date) ?? []) : undefined),
    [recordsByDate],
  );

  const openDay = (date: Date, modifiers: Modifiers) => {
    if (didSwipeRef.current) return;

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
            onClick={() => settleMonth(-1)}
            onPointerDown={() => prefetchAhead(-1)}
          />
          <IconButton
            aria-label="다음 달"
            icon={CaretRightIcon}
            onClick={() => settleMonth(1)}
            onPointerDown={() => prefetchAhead(1)}
          />
        </div>
      </header>

      {isError ? (
        <LoadErrorAlert icon={<NotePencilIcon aria-hidden="true" />} title="기록을 불러오지 못했어요" />
      ) : null}

      <div className="flex flex-1 touch-pan-y overflow-hidden" ref={viewportRef}>
        <motion.div
          // 가운데 달이 화면에 맞도록 세 달짜리 띠를 한 달만큼 왼쪽에서 시작한다.
          className="-ml-[100%] flex w-[300%] shrink-0"
          drag="x"
          // 띠가 화면보다 넓어 앞뒤 한 달까지만 끌리고, 너비를 따로 재지 않아도 된다.
          dragConstraints={viewportRef}
          dragDirectionLock
          dragElastic={0.1}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          onDragStart={() => {
            didSwipeRef.current = true;
          }}
          style={{ x }}
        >
          {months.map((value, index) => (
            <CalendarMonth
              isCurrent={index === CURRENT_MONTH_INDEX}
              key={value}
              month={value}
              onDayClick={openDay}
              onMonthChange={(date) => changeMonth(format(date, "yyyy-MM"))}
              records={monthQueries[index].data}
              selectedDate={selectedDate}
              titleLines={titleLines}
              today={today}
            />
          ))}
        </motion.div>
      </div>

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
