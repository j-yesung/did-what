"use client";

import { type MouseEvent, useRef, useState } from "react";

import { TrashIcon } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useFunnel } from "@use-funnel/browser";
import { format, parseISO } from "date-fns";

import {
  formatRecordRegionLabels,
  RecordCategoryBadge,
  RecordCreateButton,
  type RecordSummary,
  recordDetailQueryOptions,
  recordSummaryQueryKey,
} from "@/entities/record";
import { recordCommentListQueryOptions } from "@/entities/record-comment";
import { DeleteRecordConfirm } from "@/features/record/delete-record";
import { useScrollRestoration } from "@/shared/lib/navigation/use-scroll-restoration";
import { cn } from "@/shared/lib/utils";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { buttonVariants } from "@/shared/ui/button";
import { Empty, EmptyHeader, EmptyTitle } from "@/shared/ui/empty";
import { LiquidGlassButton } from "@/shared/ui/liquid-glass-button";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { PressLink } from "@/shared/ui/press-link";
import { Separator } from "@/shared/ui/separator";
import { Spinner } from "@/shared/ui/spinner";
import { RecordSheetDetail } from "@/widgets/record-sheet-detail";

import { getCalendarHref, getDaySheetRecordId } from "../model/record-calendar";

const DAY_TITLE = new Intl.DateTimeFormat("ko-KR", { day: "numeric", month: "long", weekday: "long" });
const SHEET_HEIGHT = "calc(100dvh - env(safe-area-inset-top) - 16px - var(--drawer-keyboard-inset, 0px))";

type RecordDayBottomSheetProps = {
  date: string | null;
  isError: boolean;
  member: { id: string; name: string };
  onCloseComplete: () => void;
  onOpenChange: (open: boolean) => void;
  onRetry: () => void;
  open: boolean;
  records: readonly RecordSummary[] | undefined;
};

function RecordDayCreateButton({ date }: { date: string }) {
  const closeBottomSheetOnReturn = (event: MouseEvent<HTMLAnchorElement>) => {
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
    <RecordCreateButton className="size-14" href={`/records/new?date=${date}`} onClick={closeBottomSheetOnReturn} />
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
    <LiquidGlassButton
      aria-label={`${record.activity} 삭제`}
      className={cn("size-10 shrink-0 text-destructive [&_svg]:size-5", className)}
      onClick={onClick}
      shape="circle"
    >
      <TrashIcon aria-hidden="true" weight="bold" />
    </LiquidGlassButton>
  );
}

type DaySheetSteps = {
  list: { date: string | null; recordId: null };
  detail: { date: string; recordId: string };
};

export function RecordDayBottomSheet({
  date,
  isError,
  member,
  onCloseComplete,
  onOpenChange,
  onRetry,
  open,
  records,
}: RecordDayBottomSheetProps) {
  const funnel = useFunnel<DaySheetSteps>({
    id: "calendar-record-sheet",
    initial: { step: "list", context: { date: null, recordId: null } },
    disableCleanup: true,
  });
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecordSummary | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const multipleRecords = Boolean(records && records.length > 1);
  const selectedRecordId = funnel.step === "detail" && funnel.context.date === date ? funnel.context.recordId : null;
  const detailRecordId = getDaySheetRecordId(records, selectedRecordId);
  const detailRecord = records?.find(({ id }) => id === detailRecordId);
  const isDetail = Boolean(detailRecordId);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [previousIsDetail, setPreviousIsDetail] = useState(isDetail);
  const [direction, setDirection] = useState<"forward" | "backward" | null>(null);
  if (previousIsDetail !== isDetail) {
    setPreviousIsDetail(isDetail);
    setDirection(open && multipleRecords ? (isDetail ? "forward" : "backward") : null);
  }

  useScrollRestoration(scrollRef, open);

  const cacheRecordSummary = (record: RecordSummary) => {
    queryClient.setQueryData(recordSummaryQueryKey(record.id), record);
  };

  const prefetchDetail = (record: RecordSummary) => {
    cacheRecordSummary(record);
    void queryClient.prefetchQuery(recordDetailQueryOptions(record.id));
    void queryClient.prefetchInfiniteQuery(recordCommentListQueryOptions(record.id));
  };

  const openDeleteConfirm = (record: RecordSummary) => {
    setDeleteTarget(record);
    setDeleteOpen(true);
  };

  return (
    <BottomSheet
      onOpenChange={onOpenChange}
      onOpenChangeComplete={(nextOpen) => {
        if (nextOpen) return;
        setDrafts({});
        setDeleteTarget(null);
        setDeleteOpen(false);
        setDirection(null);
        void funnel.history.replace("list", { date: null, recordId: null });
        onCloseComplete();
      }}
      open={open}
      showSwipeHandle
    >
      <BottomSheet.VirtualKeyboardProvider>
        <BottomSheet.Content
          overlayHandle
          className={cn(
            "[--drawer-content-max-height:calc(100dvh-env(safe-area-inset-top)-16px-var(--drawer-keyboard-inset,0px))]",
            isDetail && "bottom-(--drawer-keyboard-inset,0px)",
          )}
          style={{ height: SHEET_HEIGHT }}
        >
          <div className="relative flex min-h-0 flex-1 flex-col">
            <div
              className={cn("flex min-h-0 flex-1 flex-col pt-7", isDetail && "invisible absolute inset-0")}
              data-direction={isDetail ? undefined : (direction ?? undefined)}
              data-funnel-step
              inert={isDetail}
            >
              <BottomSheet.Header className="flex-row items-center justify-between gap-3 text-left group-data-[swipe-axis=y]/bottom-sheet-popup:text-left">
                <div className="min-w-0">
                  {isDetail ? (
                    <p className="truncate font-bold text-xl leading-7">
                      {date ? DAY_TITLE.format(parseISO(date)) : null}
                    </p>
                  ) : (
                    <BottomSheet.Title className="truncate font-bold text-xl leading-7">
                      {date ? DAY_TITLE.format(parseISO(date)) : null}
                    </BottomSheet.Title>
                  )}
                  {multipleRecords ? (
                    <p className="mt-0.5 text-muted-foreground text-sm tabular-nums">기록 {records?.length}개</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {date ? <RecordDayCreateButton date={date} /> : null}
                </div>
              </BottomSheet.Header>

              <div
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-2 pb-[calc(--spacing(5)+env(safe-area-inset-bottom))]"
                ref={scrollRef}
              >
                {records ? (
                  records.length > 0 ? (
                    <ul>
                      {records.map((record, index) => {
                        const region = formatRecordRegionLabels(record);
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
                                onClick={(event) => {
                                  if (
                                    event.defaultPrevented ||
                                    event.button !== 0 ||
                                    event.altKey ||
                                    event.ctrlKey ||
                                    event.metaKey ||
                                    event.shiftKey ||
                                    !date
                                  )
                                    return;
                                  event.preventDefault();
                                  cacheRecordSummary(record);
                                  void funnel.history.push("detail", { date, recordId: record.id });
                                }}
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
                                    {period ? <span className="shrink-0 tabular-nums">{period}</span> : null}
                                    {period && region ? <span aria-hidden="true">·</span> : null}
                                    {region ? <span className="truncate">{region}</span> : null}
                                    <RecordCategoryBadge category={record.category} />
                                  </span>
                                </span>
                              </PressLink>
                              <RecordDeleteButton onClick={() => openDeleteConfirm(record)} record={record} />
                            </div>
                          </li>
                        );
                      })}
                    </ul>
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
            </div>
            {detailRecordId ? (
              <div
                className="flex min-h-0 flex-1 flex-col"
                data-direction={direction ?? undefined}
                data-funnel-step
                key={detailRecordId}
              >
                <RecordSheetDetail
                  actions={
                    <div className="flex items-center gap-2">
                      {date ? <RecordDayCreateButton date={date} /> : null}
                      {detailRecord ? (
                        <RecordDeleteButton
                          className="size-14 [&_svg]:size-6"
                          onClick={() => openDeleteConfirm(detailRecord)}
                          record={detailRecord}
                        />
                      ) : null}
                    </div>
                  }
                  backLabel={multipleRecords ? "날짜별 기록 목록으로" : "달력으로"}
                  draft={drafts[detailRecordId] ?? ""}
                  member={member}
                  onBack={() => {
                    if (multipleRecords) void funnel.history.back();
                    else onOpenChange(false);
                  }}
                  onDraftChange={(next) =>
                    setDrafts((current) => ({
                      ...current,
                      [detailRecordId]: typeof next === "function" ? next(current[detailRecordId] ?? "") : next,
                    }))
                  }
                  recordId={detailRecordId}
                />
              </div>
            ) : null}
          </div>
        </BottomSheet.Content>
      </BottomSheet.VirtualKeyboardProvider>
      <DeleteRecordConfirm
        activity={deleteTarget?.activity ?? ""}
        onClose={() => setDeleteOpen(false)}
        onDeleted={() => {
          if (records?.length === 1) onOpenChange(false);
        }}
        open={deleteOpen}
        recordId={deleteTarget?.id ?? ""}
      />
    </BottomSheet>
  );
}
