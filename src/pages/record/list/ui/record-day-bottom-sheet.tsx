"use client";

import { type MouseEvent, useRef, useState } from "react";

import { TrashIcon } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { useRouter } from "next/navigation";

import { PlaceIconTile } from "@/entities/place";
import {
  formatRecordRegionLabels,
  RecordCategoryBadge,
  RecordCreateButton,
  RecordDetailHeader,
  type RecordSummary,
  recordPlacesQueryOptions,
  recordSummaryQueryKey,
} from "@/entities/record";
import { recordCommentListQueryOptions } from "@/entities/record-comment";
import { PlaceSaveButton } from "@/features/place/save-place";
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

import { getCalendarHref } from "../model/record-calendar";

const DAY_TITLE = new Intl.DateTimeFormat("ko-KR", { day: "numeric", month: "long", weekday: "long" });
const SHEET_HEIGHT = "calc(100dvh - env(safe-area-inset-top) - 16px - var(--drawer-keyboard-inset, 0px))";

type RecordDayBottomSheetProps = {
  date: string | null;
  isError: boolean;
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

function CalendarRecordPlaces({ record }: { record: RecordSummary }) {
  const count = record.record_places?.[0]?.count;
  const placesQuery = useQuery({ ...recordPlacesQueryOptions(record.id), enabled: count !== 0 });
  const places = placesQuery.data?.record_places;
  if (count === 0 || places?.length === 0) return null;
  if (placesQuery.isError) {
    return <LoadErrorAlert onRetry={() => void placesQuery.refetch()} title="방문 장소 정보를 불러오지 못했어요" />;
  }
  return (
    <section aria-label="방문 장소" className="mt-6 px-1">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 className="font-semibold text-base">우리 어디 갔지?</h4>
        {places || count !== undefined ? (
          <p className="text-muted-foreground text-xs">함께한 장소 {places?.length ?? count}곳</p>
        ) : null}
      </div>
      {places ? (
        <ul>
          {places.map(({ place }) => (
            <li className="flex min-h-11 items-center gap-3 border-b py-3" key={place.id}>
              <PlaceIconTile place={place} />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{place.name}</p>
                {place.address ? (
                  <p className="mt-0.5 truncate text-muted-foreground text-xs">{place.address}</p>
                ) : null}
              </div>
              <PlaceSaveButton placeId={place.id} placeName={place.name} saved={Boolean(place.saved_at)} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex justify-center py-4 text-muted-foreground">
          <Spinner aria-label="방문 장소를 불러오는 중" />
        </div>
      )}
    </section>
  );
}

export function RecordDayBottomSheet({
  date,
  isError,
  onOpenChange,
  onRetry,
  open,
  records,
}: RecordDayBottomSheetProps) {
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
    <BottomSheet onOpenChange={onOpenChange} open={open} showSwipeHandle>
      <BottomSheet.Content
        className="[--drawer-content-max-height:calc(100dvh-env(safe-area-inset-top)-16px-var(--drawer-keyboard-inset,0px))]"
        style={{ height: SHEET_HEIGHT }}
      >
        <BottomSheet.Header className="flex-row items-center justify-between gap-3 text-left group-data-[swipe-axis=y]/bottom-sheet-popup:text-left">
          <div className="min-w-0">
            <BottomSheet.Title className="truncate font-bold text-xl leading-7">
              {date ? DAY_TITLE.format(parseISO(date)) : null}
            </BottomSheet.Title>
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
        </BottomSheet.Header>

        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[calc(--spacing(5)+env(safe-area-inset-bottom))]",
            multipleRecords ? "pt-2" : "pt-4",
          )}
          ref={scrollRef}
        >
          {records ? (
            records.length > 0 ? (
              records.length === 1 ? (
                records.map((record) => {
                  const region = formatRecordRegionLabels(record, Number.POSITIVE_INFINITY);

                  return (
                    <article key={record.id}>
                      <PressLink
                        aria-label={`${record.activity} 상세 화면 열기`}
                        className={cn(
                          buttonVariants({ variant: "ghost" }),
                          "h-auto w-full min-w-0 justify-start whitespace-normal rounded-3xl p-0 text-left font-normal after:hidden",
                        )}
                        href={`/records/${record.id}`}
                        onClick={() => cacheRecordSummary(record)}
                        onPointerDown={(event) => {
                          if (event.button === 0) prefetchDetail(record);
                        }}
                        prefetch={false}
                      >
                        <RecordDetailHeader heading="h3" record={record} regionText={region} />
                      </PressLink>
                      <CalendarRecordPlaces record={record} />
                      {record.memo ? (
                        <section className="mt-6 px-1">
                          <h4 className="mb-3 font-semibold text-base">우리 뭐했지?</h4>
                          <div className="flex flex-col gap-1.5 border-primary border-l-2 pl-4 text-sm leading-relaxed">
                            {record.memo.split("\n").map((line, index) => (
                              <p className="min-h-lh whitespace-pre-wrap" key={`${record.id}-${index}`}>
                                {line}
                              </p>
                            ))}
                          </div>
                        </section>
                      ) : null}
                    </article>
                  );
                })
              ) : (
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
      </BottomSheet.Content>
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
