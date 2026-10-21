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
import { IconButton } from "@/shared/ui/icon-button";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";

import {
  getCalendarHref,
  getCalendarRange,
  getCalendarSwipeMonthShift,
  getCalendarWeekLayout,
  getDefaultCalendarDate,
  getToday,
  groupRecordsByDate,
  parseCalendarDate,
  parseCalendarMonth,
  shiftMonth,
} from "../model/record-calendar";
import { RecordDayList } from "./record-day-list";
import { RecordDetailBottomSheet } from "./record-detail-bottom-sheet";

const TITLE_LINES = 1;
// 앞뒤 달을 함께 그려 드래그 중에도 다음 달이 손가락을 따라 나타나게 한다.
const MONTH_OFFSETS = [-1, 0, 1];
const CURRENT_MONTH_INDEX = 1;
const EMPTY_RECORDS_BY_DATE: ReadonlyMap<string, readonly RecordSummary[]> = new Map();
const EMPTY_HIDDEN_COUNTS: ReadonlyMap<string, number> = new Map();
const SNAP_SPRING = { bounce: 0, type: spring, visualDuration: 0.25 } as const;

const RecordCalendarContext = createContext(EMPTY_RECORDS_BY_DATE);
const RecordWeekContext = createContext(EMPTY_HIDDEN_COUNTS);

/**
 * 셀 전체가 날짜 버튼 하나다. 제목 띠는 보여주기만 하고 누를 수 없다.
 * 라이브러리 DayButton으로 감싸 키보드 이동 때의 포커스 처리를 그대로 쓴다.
 */
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
          // 파란 글자는 다크 배경에서 대비가 모자라 오늘은 테두리로만 표시한다.
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

/**
 * 제목 띠를 주 위에 겹쳐 그리려고 표를 flex로 배치한다.
 * 표 요소의 display를 바꾸면 Safari가 행 의미를 지우는 경우가 있어 역할을 직접 적는다.
 */
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
        {/* 날짜 버튼의 위 여백(0.125rem)과 숫자(1.5rem) 아래에 제목 띠를 놓는다. */}
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

const replaceCalendarHref = (month: string, date?: string | null) => {
  window.history.replaceState(window.history.state, "", getCalendarHref(month, date, window.location.search));
};

type CalendarMonthProps = {
  month: string;
  onDayClick: (date: Date) => void;
  onMonthChange: (date: Date) => void;
  records: readonly RecordSummary[] | undefined;
  selectedDate: string | null;
  today: string;
};

/** 한 달치 달력. 날짜 선택처럼 월 데이터가 바뀌지 않는 렌더에서는 다시 그리지 않는다. */
const CalendarMonth = memo(function CalendarMonth({
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
  const [month, setMonth] = useState(initialMonth);
  const [selectedDate, setSelectedDate] = useState(
    () => parseCalendarDate(searchParams?.get("date"), initialMonth) ?? getDefaultCalendarDate(initialMonth, today),
  );
  const [detailRecord, setDetailRecord] = useState<RecordSummary | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
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

  useEffect(() => () => snapAnimationRef.current?.stop(), []);

  // 서버 요청과 이력 추가 없이 주소만 바꿔 상세나 작성 화면에서 돌아왔을 때 같은 날을 보여준다.
  const changeMonth = useCallback((nextMonth: string, nextDate = getDefaultCalendarDate(nextMonth, getToday())) => {
    monthRef.current = nextMonth;
    setMonth(nextMonth);
    setSelectedDate(nextDate);
    replaceCalendarHref(nextMonth, nextDate);
  }, []);

  const stopSnap = useCallback(() => {
    const track = trackRef.current;
    if (!track || !snapAnimationRef.current) return;
    const offsetX = new DOMMatrixReadOnly(getComputedStyle(track).transform).m41;
    snapAnimationRef.current.stop();
    snapAnimationRef.current = null;
    x.jump(offsetX);
  }, [x]);

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

  const handleDayClick = useCallback(
    (date: Date) => {
      stopSnap();
      x.jump(0);
      changeMonth(format(date, "yyyy-MM"), format(date, "yyyy-MM-dd"));
    },
    [changeMonth, stopSnap, x],
  );
  const handleMonthChange = useCallback((date: Date) => changeMonth(format(date, "yyyy-MM")), [changeMonth]);

  const openRecord = (record: RecordSummary) => {
    setDetailRecord(record);
    setDetailOpen(true);
  };

  return (
    <section className="relative flex min-h-0 flex-1 flex-col gap-2" data-screen="calendar">
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
        <div aria-label="달력 조작" className="flex shrink-0 items-center gap-1" role="group">
          <Button color="dark" onClick={() => jumpToMonth(today.slice(0, 7))} variant="weak">
            오늘
          </Button>
          <IconButton aria-label="이전 달" icon={CaretLeftIcon} onClick={() => settleMonth(-1)} />
          <IconButton aria-label="다음 달" icon={CaretRightIcon} onClick={() => settleMonth(1)} />
        </div>
      </header>

      {isError ? (
        <LoadErrorAlert
          icon={<NotePencilIcon aria-hidden="true" />}
          onRetry={() => void recordsQuery.refetch()}
          retrying={recordsQuery.isFetching}
          title="기록을 불러오지 못했어요"
        />
      ) : null}

      {/* 세로 이동을 브라우저에 넘기면 대각선 스와이프가 세로 스크롤로 바뀌어 월 이동이 끊긴다. */}
      <div className="relative flex w-full min-w-0 shrink-0 touch-none overflow-hidden" ref={viewportRef}>
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
                  today={today}
                />
              </CalendarMonthBuffer>
            </div>
          ))}
        </motion.div>
      </div>

      {/* 날짜를 바꾸면 목록 스크롤을 맨 위로 되돌린다. */}
      <RecordDayList
        date={selectedDate}
        key={selectedDate}
        onRecordOpen={openRecord}
        records={recordsByDate ? (recordsByDate.get(selectedDate) ?? []) : undefined}
      />

      <RecordDetailBottomSheet member={member} onOpenChange={setDetailOpen} open={detailOpen} record={detailRecord} />
    </section>
  );
}
