"use client";

import {
  createContext,
  memo,
  type ReactNode,
  useCallback,
  useContext,
  useDeferredValue,
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
import { flushSync } from "react-dom";

import { CaretDownIcon, CaretLeftIcon, CaretRightIcon, NotePencilIcon } from "@phosphor-icons/react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { spring } from "motion";
import { animate } from "motion/mini";
import { motion, type PanInfo, useMotionTemplate, useMotionValue, useReducedMotion } from "motion/react";
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
  getCalendarRange,
  getCalendarSwipeMonthShift,
  getCalendarWeekLayout,
  getTitleLines,
  getToday,
  groupRecordsByDate,
  parseCalendarDate,
  parseCalendarMonth,
  shiftMonth,
} from "../model/record-calendar";
import { CalendarRecordCreateButton } from "./calendar-record-create-button";
import { RecordDayBottomSheet } from "./record-day-bottom-sheet";

// 칸 높이를 재기 전(서버 렌더링 포함)에 쓰는 제목 줄 수
const DEFAULT_TITLE_LINES = 2;
// 앞뒤 달을 함께 그려 드래그 중에도 다음 달이 손가락을 따라 나타나게 한다.
const MONTH_OFFSETS = [-1, 0, 1];
const CURRENT_MONTH_INDEX = 1;
const EMPTY_RECORDS_BY_DATE: ReadonlyMap<string, readonly RecordSummary[]> = new Map();
const SNAP_SPRING = { bounce: 0, type: spring, visualDuration: 0.25 } as const;

type RecordCalendarContextValue = {
  recordsByDate: ReadonlyMap<string, readonly RecordSummary[]>;
  titleLines: number;
};

const RecordCalendarContext = createContext<RecordCalendarContextValue>({
  recordsByDate: EMPTY_RECORDS_BY_DATE,
  titleLines: DEFAULT_TITLE_LINES,
});

const RecordWeekContext = createContext({ hiddenCounts: new Map<string, number>(), visibleLines: 0 });

/**
 * 셀 전체가 날짜 버튼 하나다. 제목 띠는 보여주기만 하고 누를 수 없다.
 * 라이브러리 DayButton으로 감싸 키보드 이동 때의 포커스 처리를 그대로 쓴다.
 */
function RecordDayButton({ children, day, modifiers, ...props }: DayButtonProps) {
  const { recordsByDate } = useContext(RecordCalendarContext);
  const { hiddenCounts, visibleLines } = useContext(RecordWeekContext);
  const records = recordsByDate.get(day.isoDate) ?? [];
  const hiddenCount = hiddenCounts.get(day.isoDate) ?? 0;

  return (
    <DayButton
      {...props}
      aria-label={
        records.length > 0
          ? `${props["aria-label"]}, 기록 ${records.length}개, ${records.map((record) => record.activity).join(", ")}`
          : props["aria-label"]
      }
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
      {/* 여러 기록을 묶은 표시라 어느 카테고리도 대표할 수 없다. */}
      {hiddenCount > 0 ? (
        <span
          className="absolute inset-x-0.5 h-4 rounded-lg bg-muted-foreground/15 px-1 text-[0.625rem] text-muted-foreground leading-4"
          style={{ top: `calc(1.75rem + 1px + ${visibleLines} * (1rem + 1px))` }}
        >
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

function RecordWeek({ week, children, ...props }: WeekProps) {
  const { recordsByDate, titleLines } = useContext(RecordCalendarContext);
  const layout = useMemo(
    () =>
      getCalendarWeekLayout(
        recordsByDate,
        week.days.map((day) => day.isoDate),
        titleLines,
      ),
    [recordsByDate, titleLines, week],
  );
  const weekContext = useMemo(
    () => ({
      hiddenCounts: new Map(week.days.map((day, index) => [day.isoDate, layout.hiddenCounts[index]])),
      visibleLines: layout.visibleLines,
    }),
    [layout, week],
  );

  return (
    <RecordWeekContext.Provider value={weekContext}>
      <tr role="row" {...props}>
        {children}
        <td
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-[calc(2rem+1px)] grid auto-rows-[1rem] grid-cols-7 gap-y-px"
          colSpan={7}
          role="presentation"
        >
          {layout.segments.map(({ record, start, end, lane }) => (
            <span
              className={cn(
                "fade-in-0 mx-0.5 min-w-0 animate-in truncate rounded-lg px-1 text-[0.625rem] text-foreground leading-4 duration-150 motion-reduce:animate-none",
                RECORD_CATEGORY_FILL[normalizeRecordCategory(record.category)],
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
  week: "relative flex flex-1 basis-0 border-t",
  weekday: "min-w-0 flex-1 basis-0 pb-2 text-center font-normal text-muted-foreground text-xs",
  weekdays: "flex",
  weeks: "flex flex-1 flex-col",
};

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

function CalendarMonthBuffer({ active, children }: { active: boolean; children: ReactNode }) {
  // 새로 추가되는 화면 밖 달은 월 확정과 좌표 보정이 끝난 뒤 낮은 우선순위로 그린다.
  const deferredChildren = useDeferredValue(children, null);
  return active ? children : deferredChildren;
}

export function RecordCalendar({ member }: { member: { id: string; name: string } }) {
  const searchParams = useSearchParams();
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
  const trackRef = useRef<HTMLDivElement>(null);
  const snapAnimationRef = useRef<ReturnType<typeof animate> | null>(null);
  const monthRef = useRef(month);
  const didSwipeRef = useRef(false);
  const x = useMotionValue(0);
  const transform = useMotionTemplate`translate3d(${x}px, 0, 0)`;

  const months = useMemo(() => MONTH_OFFSETS.map((offset) => shiftMonth(month, offset)), [month]);
  const ranges = useMemo(() => months.map(getCalendarRange), [months]);
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

  useEffect(() => () => snapAnimationRef.current?.stop(), []);

  // 서버 요청과 이력 추가 없이 주소의 월만 바꿔 상세에서 돌아왔을 때 같은 달을 보여준다.
  const changeMonth = useCallback((nextMonth: string, keepSelection = false) => {
    monthRef.current = nextMonth;
    setMonth(nextMonth);
    if (!keepSelection) {
      setSelectedDate(null);
      setPendingDate(null);
      setOpen(false);
    }
    replaceCalendarHref(nextMonth);
  }, []);

  const stopSnap = () => {
    const track = trackRef.current;
    if (!track || !snapAnimationRef.current) return;
    const offsetX = new DOMMatrixReadOnly(getComputedStyle(track).transform).m41;
    snapAnimationRef.current.stop();
    snapAnimationRef.current = null;
    x.jump(offsetX);
  };

  const settleMonth = (amount: number, velocity = 0) => {
    stopSnap();
    const width = viewportRef.current?.offsetWidth ?? 0;
    if (amount !== 0 && width > 0) {
      const offsetX = x.get();
      // 월과 좌표를 같은 프레임에서 바꿔 달을 재배치하는 순간 화면이 튀지 않게 한다.
      flushSync(() => changeMonth(shiftMonth(monthRef.current, amount)));
      // 좌표 보정을 속도로 읽지 않도록 jump을 쓰고 손을 뗀 속도만 스프링에 넘긴다.
      x.jump(shouldReduceMotion ? 0 : offsetX + amount * width);
    }
    const track = trackRef.current;
    const offsetX = x.get();
    if (!track || shouldReduceMotion || Math.abs(offsetX) < 0.5) {
      x.jump(0);
      return;
    }
    // transform을 직접 애니메이션하면 새 달 렌더링 중에도 브라우저가 전환을 이어간다.
    snapAnimationRef.current = animate(
      track,
      { transform: [`translate3d(${offsetX}px, 0, 0)`, "translate3d(0px, 0, 0)"] },
      {
        ...SNAP_SPRING,
        // 문자열 transform 스프링은 0~100 진행률을 쓰므로 px/s를 같은 단위로 바꾼다.
        velocity: (-velocity / offsetX) * 100,
        onComplete: () => {
          snapAnimationRef.current = null;
          x.jump(0);
        },
      },
    );
  };

  const handleDragEnd = (event: PointerEvent, info: PanInfo) => {
    settleMonth(
      event.type === "pointercancel" ? 0 : getCalendarSwipeMonthShift(info.offset.x, info.velocity.x),
      info.velocity.x,
    );
  };

  const jumpToMonth = (nextMonth: string) => {
    stopSnap();
    x.jump(0);
    changeMonth(nextMonth);
  };

  // 아직 이번 달을 받지 못했으면 '기록 없음'인지 알 수 없다.
  const getDayRecords = useCallback(
    (date: string | null) => (date && recordsByDate ? (recordsByDate.get(date) ?? []) : undefined),
    [recordsByDate],
  );

  const openDay = (date: Date, modifiers: Modifiers) => {
    stopSnap();
    x.jump(0);
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
            onChange={(event) => jumpToMonth(event.target.value)}
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
        <Button color="dark" onClick={() => jumpToMonth(today.slice(0, 7))} variant="weak">
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

      <div
        className="relative flex w-full min-w-0 flex-1 touch-pan-y touch-pinch-zoom overflow-hidden"
        ref={viewportRef}
      >
        <motion.div
          className="motion-reduce:transform-none! ml-[-100%] flex w-[300%] shrink-0 will-change-transform"
          drag="x"
          dragConstraints={viewportRef}
          dragDirectionLock
          dragElastic={0.1}
          dragMomentum={false}
          onClickCapture={(event) => {
            if (!didSwipeRef.current || event.detail === 0) return;
            event.preventDefault();
            event.stopPropagation();
            didSwipeRef.current = false;
          }}
          onDragEnd={handleDragEnd}
          onDragStart={() => {
            didSwipeRef.current = true;
          }}
          onPointerDownCapture={() => {
            stopSnap();
            didSwipeRef.current = false;
          }}
          onPointerCancelCapture={() => settleMonth(0)}
          onPointerUpCapture={() => {
            if (!didSwipeRef.current) settleMonth(0);
          }}
          ref={trackRef}
          style={{ transform, x }}
        >
          {months.map((value, index) => (
            <div
              aria-hidden={index !== CURRENT_MONTH_INDEX}
              className="flex w-1/3 min-w-0 shrink-0 flex-col"
              inert={index !== CURRENT_MONTH_INDEX}
              key={value}
            >
              <CalendarMonthBuffer active={index === CURRENT_MONTH_INDEX}>
                <CalendarMonth
                  month={value}
                  onDayClick={handleDayClick}
                  onMonthChange={handleMonthChange}
                  records={monthQueries[index].data}
                  selectedDate={index === CURRENT_MONTH_INDEX ? selectedDate : null}
                  titleLines={titleLines}
                  today={today}
                />
              </CalendarMonthBuffer>
            </div>
          ))}
        </motion.div>
      </div>

      <div className="flex h-24 shrink-0 flex-col items-center justify-center gap-2 pb-2">
        <div className="flex h-5 items-center justify-center text-center">
          {createDate ? (
            <p className="text-muted-foreground text-sm">{format(parseISO(createDate), "M월 d일")}</p>
          ) : null}
        </div>
        <div aria-label="달력 조작" className="flex w-full items-center justify-between" role="group">
          <LiquidGlassButton aria-label="이전 달" onClick={() => settleMonth(-1)} shape="circle">
            <CaretLeftIcon aria-hidden="true" />
          </LiquidGlassButton>
          <CalendarRecordCreateButton date={createDate} />
          <LiquidGlassButton aria-label="다음 달" onClick={() => settleMonth(1)} shape="circle">
            <CaretRightIcon aria-hidden="true" />
          </LiquidGlassButton>
        </div>
      </div>

      <RecordDayBottomSheet
        date={selectedDate}
        isError={isError}
        member={member}
        onCloseComplete={() => {
          setSelectedDate(null);
          replaceCalendarHref(month);
        }}
        onOpenChange={handleBottomSheetOpenChange}
        onRetry={() => void recordsQuery.refetch()}
        open={open}
        records={selectedRecords}
      />
    </section>
  );
}
