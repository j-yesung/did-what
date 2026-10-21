"use client";

import { type ReactNode, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";

import { CaretDownIcon, CaretLeftIcon, CaretRightIcon, NotePencilIcon } from "@phosphor-icons/react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { spring } from "motion";
import { animate } from "motion/mini";
import { motion, type PanInfo, useMotionTemplate, useMotionValue, useReducedMotion } from "motion/react";
import { useSearchParams } from "next/navigation";

import { type RecordSummary, recordCalendarQueryOptions, recordMonthBoundsQueryOptions } from "@/entities/record";
import { Button } from "@/shared/ui/button";
import { IconButton } from "@/shared/ui/icon-button";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";

import {
  getCalendarHref,
  getCalendarRange,
  getCalendarSwipeMonthShift,
  getDefaultCalendarDate,
  getToday,
  groupRecordsByDate,
  parseCalendarDate,
  parseCalendarMonth,
  shiftMonth,
} from "../model/record-calendar";
import { CalendarMonth } from "./calendar-month";
import { RecordDayList } from "./record-day-list";
import { RecordDetailBottomSheet } from "./record-detail-bottom-sheet";

// 앞뒤 달을 함께 그려 드래그 중에도 다음 달이 손가락을 따라 나타나게 한다.
const MONTH_OFFSETS = [-1, 0, 1];
const CURRENT_MONTH_INDEX = 1;
const SNAP_SPRING = { bounce: 0, type: spring, visualDuration: 0.25 } as const;

const replaceCalendarHref = (month: string, date?: string | null) => {
  window.history.replaceState(window.history.state, "", getCalendarHref(month, date, window.location.search));
};

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
