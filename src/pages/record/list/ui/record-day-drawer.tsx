"use client";

import { type MouseEvent, useRef, useState } from "react";

import { CaretRightIcon, TrashIcon } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { useRouter } from "next/navigation";

import {
  formatRecordRegionLabels,
  getRecordCategoryLabel,
  getRecordWeatherLabel,
  normalizeRecordCategory,
  normalizeRecordWeather,
  type RecordSummary,
  recordPlacesQueryOptions,
  recordSummaryQueryKey,
  WeatherIcon,
} from "@/entities/record";
import { recordCommentListQueryOptions } from "@/entities/record-comment";
import { DeleteRecordConfirm } from "@/features/record/delete-record";
import { formatRecordPeriod } from "@/shared/lib/date/format-date";
import { useScrollRestoration } from "@/shared/lib/navigation/use-scroll-restoration";
import { cn } from "@/shared/lib/utils";
import { buttonVariants } from "@/shared/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/shared/ui/drawer";
import { Empty, EmptyHeader, EmptyTitle } from "@/shared/ui/empty";
import { IconButton } from "@/shared/ui/icon-button";
import { LiquidGlassButton } from "@/shared/ui/liquid-glass-button";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { PressLink } from "@/shared/ui/press-link";
import { PressScale } from "@/shared/ui/press-scale";
import { Separator } from "@/shared/ui/separator";
import { Spinner } from "@/shared/ui/spinner";
import { RecordCreateButton } from "@/widgets/record-create-button";

import { getCalendarHref } from "../model/record-calendar";

const DAY_TITLE = new Intl.DateTimeFormat("ko-KR", { day: "numeric", month: "long", weekday: "long" });

type RecordDayDrawerProps = {
  date: string | null;
  isError: boolean;
  onOpenChange: (open: boolean) => void;
  onRetry: () => void;
  open: boolean;
  records: readonly RecordSummary[] | undefined;
};

function RecordDayCreateButton({ date }: { date: string }) {
  const closeDrawerOnReturn = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey
    )
      return;

    window.history.replaceState(window.history.state, "", getCalendarHref(date.slice(0, 7)));
  };

  return (
    <PressScale className="pointer-events-auto inline-flex">
      <RecordCreateButton className="size-14" href={`/records/new?date=${date}`} onClick={closeDrawerOnReturn} />
    </PressScale>
  );
}

function RecordDeleteButton({
  className,
  onClick,
  record,
}: {
  className?: string;
  onClick: () => void;
  record: RecordSummary;
}) {
  return (
    <PressScale className="pointer-events-auto inline-flex">
      <LiquidGlassButton
        aria-label={`${record.activity} 삭제`}
        className={cn("size-10 shrink-0 text-destructive [&_svg]:size-5", className)}
        onClick={onClick}
        shape="circle"
      >
        <TrashIcon aria-hidden="true" weight="bold" />
      </LiquidGlassButton>
    </PressScale>
  );
}

export function RecordDayDrawer({ date, isError, onOpenChange, onRetry, open, records }: RecordDayDrawerProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecordSummary | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const multipleRecords = Boolean(records && records.length > 1);
  const singleRecord = records?.length === 1 ? records[0] : null;

  useScrollRestoration(scrollRef, open);

  const cacheRecordSummary = (record: RecordSummary) => {
    queryClient.setQueryData(recordSummaryQueryKey(record.id), record);
  };

  const prefetchDetail = (record: RecordSummary) => {
    cacheRecordSummary(record);
    router.prefetch(`/records/${record.id}`);
    void queryClient.prefetchQuery(recordPlacesQueryOptions(record.id));
    void queryClient.prefetchInfiniteQuery(recordCommentListQueryOptions(record.id));
  };

  const openDeleteConfirm = (record: RecordSummary) => {
    setDeleteTarget(record);
    setDeleteOpen(true);
  };

  return (
    <Drawer onOpenChange={onOpenChange} open={open} showSwipeHandle>
      <DrawerContent className="data-[swipe-axis=y]:max-h-[70dvh]">
        <DrawerHeader className="flex-row items-center justify-between gap-3 px-5 text-left group-data-[swipe-axis=y]/drawer-popup:text-left">
          <div className="min-w-0">
            <DrawerTitle className="truncate font-bold text-xl leading-7">
              {date ? DAY_TITLE.format(parseISO(date)) : null}
            </DrawerTitle>
            {multipleRecords ? (
              <p className="mt-0.5 text-muted-foreground text-sm tabular-nums">기록 {records?.length}개</p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {date ? <RecordDayCreateButton date={date} /> : null}
            {singleRecord ? (
              <RecordDeleteButton
                className="size-14 [&_svg]:size-6"
                onClick={() => openDeleteConfirm(singleRecord)}
                record={singleRecord}
              />
            ) : null}
          </div>
        </DrawerHeader>

        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(--spacing(5),env(safe-area-inset-bottom))]",
            multipleRecords ? "pt-2" : "pt-4",
          )}
          ref={scrollRef}
        >
          {records ? (
            records.length > 0 ? (
              records.length === 1 ? (
                records.map((record) => {
                  const region = formatRecordRegionLabels(record);
                  const weather = normalizeRecordWeather(record.weather);
                  const category = getRecordCategoryLabel(normalizeRecordCategory(record.category));

                  return (
                    <article key={record.id}>
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
                              onClick={() => cacheRecordSummary(record)}
                              onPointerDown={(event) => {
                                if (event.button === 0) prefetchDetail(record);
                              }}
                              prefetch={false}
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
                        <span className="shrink-0" aria-hidden="true">
                          ·
                        </span>
                        <span className="shrink-0">{category}</span>
                      </p>
                      {record.memo ? (
                        <p className="mt-3 whitespace-pre-wrap text-foreground leading-relaxed">{record.memo}</p>
                      ) : null}
                    </article>
                  );
                })
              ) : (
                <ul>
                  {records.map((record, index) => {
                    const region = formatRecordRegionLabels(record);
                    const weather = normalizeRecordWeather(record.weather);
                    const category = getRecordCategoryLabel(normalizeRecordCategory(record.category));
                    const period =
                      record.recorded_until && record.recorded_until !== record.recorded_at
                        ? `${format(parseISO(record.recorded_at), "M.d")}–${format(parseISO(record.recorded_until), "M.d")}`
                        : null;
                    const href = `/records/${record.id}`;

                    return (
                      <li key={record.id}>
                        {index > 0 ? <Separator className="bg-muted-foreground/20" /> : null}
                        <div className="flex items-center gap-2">
                          <PressLink
                            className={cn(
                              buttonVariants({ variant: "ghost" }),
                              "h-15 min-w-0 flex-1 justify-start rounded-none px-1 py-2 text-left font-normal after:hidden",
                            )}
                            href={href}
                            onClick={() => cacheRecordSummary(record)}
                            onPointerDown={(event) => {
                              if (event.button === 0) prefetchDetail(record);
                            }}
                            prefetch={false}
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-semibold text-base leading-5">
                                {record.activity}
                              </span>
                              <span className="mt-1 flex min-w-0 items-center gap-1.5 text-muted-foreground text-xs">
                                {period ? (
                                  <>
                                    <span className="shrink-0 tabular-nums">{period}</span>
                                    <span className="shrink-0" aria-hidden="true">
                                      ·
                                    </span>
                                  </>
                                ) : null}
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
                                <span className="shrink-0" aria-hidden="true">
                                  ·
                                </span>
                                <span className="shrink-0">{category}</span>
                              </span>
                            </span>
                            <CaretRightIcon className="ml-2 shrink-0" size={20} aria-hidden="true" />
                          </PressLink>
                          <RecordDeleteButton onClick={() => openDeleteConfirm(record)} record={record} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )
            ) : (
              <Empty className="py-10">
                <EmptyHeader>
                  <EmptyTitle className="text-muted-foreground">이날 남긴 기록이 없어요</EmptyTitle>
                </EmptyHeader>
              </Empty>
            )
          ) : isError ? (
            <LoadErrorAlert onRetry={onRetry} title="기록을 불러오지 못했어요" />
          ) : (
            <div className="flex justify-center py-10 text-muted-foreground">
              <Spinner />
            </div>
          )}
        </div>
      </DrawerContent>
      <DeleteRecordConfirm
        activity={deleteTarget?.activity ?? ""}
        onClose={() => setDeleteOpen(false)}
        onDeleted={() => {
          if (records?.length === 1) onOpenChange(false);
        }}
        open={deleteOpen}
        recordId={deleteTarget?.id ?? ""}
      />
    </Drawer>
  );
}
