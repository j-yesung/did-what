"use client";

import { useState } from "react";

import {
  getRecordCategoryLabel,
  getRecordWeatherLabel,
  normalizeRecordCategory,
  normalizeRecordWeather,
  RECORD_CATEGORY_FILL,
  type RecordSummary,
  WeatherIcon,
} from "@/entities/record";
import { DeleteRecordConfirm } from "@/features/record/delete-record";
import { formatRecordPeriod } from "@/shared/lib/date/format-date";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/shared/ui/drawer";
import { PressLink } from "@/shared/ui/press-link";

type RecordActionSheetProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  /** 닫히는 동안에도 내용이 남아 있어야 해서 닫은 뒤에도 비우지 않는다. */
  record: RecordSummary | null;
};

/** 카드와 같은 배지를 쓴다. 목록에서 보던 것과 같은 표시여야 무엇을 고른 건지 바로 이어진다. */
function RecordBadges({ record }: { record: RecordSummary }) {
  const category = normalizeRecordCategory(record.category);
  const weather = normalizeRecordWeather(record.weather);

  return (
    <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
      {category === "uncategorized" ? null : (
        <Badge className={cn("rounded-full px-1.5 py-0.5 font-medium text-foreground", RECORD_CATEGORY_FILL[category])}>
          {getRecordCategoryLabel(category)}
        </Badge>
      )}
      <Badge className="gap-1 rounded-full px-1.5 py-0.5 font-medium" tone="neutral">
        <WeatherIcon className="size-3.5" weather={weather} aria-hidden="true" />
        {getRecordWeatherLabel(weather)}
      </Badge>
    </span>
  );
}

/**
 * 목록에서 기록을 꾹 눌렀을 때 여는 동작 시트.
 *
 * 무엇에 대한 메뉴인지 머리에 적는다. 목록에서 바로 지우면 상세를 열지 않고 지우게 되므로, 대상을 여기서 확인한다.
 * 수정은 바로 이동하고 삭제만 한 번 더 묻는다.
 */
export function RecordActionSheet({ onOpenChange, open, record }: RecordActionSheetProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <Drawer onOpenChange={onOpenChange} open={open} showSwipeHandle>
        <DrawerContent className="[--drawer-height:auto]">
          <DrawerHeader className="gap-1 px-5 pt-5 pb-4 text-left group-data-[swipe-axis=y]/drawer-popup:text-left">
            <DrawerTitle className="line-clamp-2 break-keep font-bold text-xl leading-7">
              {record?.activity}
            </DrawerTitle>
            <DrawerDescription className="text-left text-sm leading-5" render={<div />}>
              {record ? (
                <>
                  {[formatRecordPeriod(record.recorded_at, record.recorded_until), record.region_label]
                    .filter(Boolean)
                    .join(" · ")}
                  <RecordBadges record={record} />
                </>
              ) : null}
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex gap-2 px-5 pb-5 *:flex-1">
            <Button
              color="dark"
              nativeButton={false}
              render={<PressLink href={`/records/${record?.id}/edit`} />}
              size="large"
              variant="weak"
            >
              수정하기
            </Button>
            <Button
              color="danger"
              onClick={() => {
                onOpenChange(false);
                setConfirmOpen(true);
              }}
              size="large"
              variant="weak"
            >
              삭제하기
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      <DeleteRecordConfirm
        activity={record?.activity ?? ""}
        onClose={() => setConfirmOpen(false)}
        open={confirmOpen}
        recordId={record?.id ?? ""}
      />
    </>
  );
}
