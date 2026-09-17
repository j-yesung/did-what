"use client";

import { Fragment } from "react";

import { CaretRightIcon } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { parseISO } from "date-fns";

import {
  getRecordWeatherLabel,
  normalizeRecordWeather,
  type RecordSummary,
  recordSummaryQueryKey,
  WeatherIcon,
} from "@/entities/record";
import { formatRecordPeriod } from "@/shared/lib/date/format-date";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/shared/ui/drawer";
import { Empty, EmptyHeader, EmptyTitle } from "@/shared/ui/empty";
import { IconButton } from "@/shared/ui/icon-button";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { PressLink } from "@/shared/ui/press-link";
import { Separator } from "@/shared/ui/separator";
import { Spinner } from "@/shared/ui/spinner";

const DAY_TITLE = new Intl.DateTimeFormat("ko-KR", { day: "numeric", month: "long", weekday: "long" });

type RecordDayDrawerProps = {
  date: string | null;
  isError: boolean;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  /** 달력 기록을 아직 받지 못했으면 undefined. 빈 배열과 구분해야 '기록 없음'을 잘못 보여주지 않는다. */
  records: readonly RecordSummary[] | undefined;
};

export function RecordDayDrawer({ date, isError, onOpenChange, open, records }: RecordDayDrawerProps) {
  const queryClient = useQueryClient();

  return (
    <Drawer onOpenChange={onOpenChange} open={open} showSwipeHandle>
      <DrawerContent>
        <DrawerHeader className="px-5 text-left group-data-[swipe-axis=y]/drawer-popup:text-left">
          <DrawerTitle className="font-bold text-xl leading-7">
            {date ? DAY_TITLE.format(parseISO(date)) : null}
          </DrawerTitle>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-4 pb-[max(--spacing(5),env(safe-area-inset-bottom))]">
          {records ? (
            records.length > 0 ? (
              records.map((record, index) => {
                const region = [record.region_label, record.region_name].filter(Boolean).join(" / ");
                const weather = normalizeRecordWeather(record.weather);

                return (
                  <Fragment key={record.id}>
                    {/* 다크 모드에서 border 토큰이 Drawer 배경과 같은 색이라 보이지 않는다. */}
                    {index > 0 ? <Separator className="my-5 bg-muted-foreground/20" /> : null}
                    <article>
                      {/* 본문을 잘못 눌러 이동하지 않도록 상세 이동은 제목 옆 버튼에만 둔다. 음수 여백으로 줄 높이는 늘리지 않는다. */}
                      <div className="flex items-start gap-2">
                        <h3 className="min-w-0 flex-1 text-balance font-bold text-lg leading-snug tracking-[-0.02em]">
                          {record.activity}
                        </h3>
                        <IconButton
                          aria-label={`${record.activity} 상세 화면 열기`}
                          className="-my-2.5 -mr-3 shrink-0"
                          icon={CaretRightIcon}
                          iconSize={20}
                          nativeButton={false}
                          render={
                            <PressLink
                              href={`/records/${record.id}`}
                              // 상세 화면이 요약을 바로 그리고 방문 장소만 불러오게 한다.
                              onClick={() => queryClient.setQueryData(recordSummaryQueryKey(record.id), record)}
                            />
                          }
                        />
                      </div>
                      <p className="mt-1.5 text-muted-foreground">
                        {formatRecordPeriod(record.recorded_at, record.recorded_until)}
                      </p>
                      <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-muted-foreground">
                        {region ? (
                          <>
                            <span className="truncate">{region}</span>
                            <span className="shrink-0" aria-hidden="true">
                              ·
                            </span>
                          </>
                        ) : null}
                        <span className="inline-flex shrink-0 items-center gap-1">
                          <WeatherIcon weather={weather} className="size-4" aria-hidden="true" />
                          {getRecordWeatherLabel(weather)}
                        </span>
                      </p>
                      {record.memo ? (
                        <p className="mt-3 whitespace-pre-wrap text-foreground leading-relaxed">{record.memo}</p>
                      ) : null}
                    </article>
                  </Fragment>
                );
              })
            ) : (
              <Empty className="py-10">
                <EmptyHeader>
                  <EmptyTitle className="text-muted-foreground">이날 남긴 기록이 없어요</EmptyTitle>
                </EmptyHeader>
              </Empty>
            )
          ) : isError ? (
            <LoadErrorAlert title="기록을 불러오지 못했어요" />
          ) : (
            <div className="flex justify-center py-10 text-muted-foreground">
              <Spinner />
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
