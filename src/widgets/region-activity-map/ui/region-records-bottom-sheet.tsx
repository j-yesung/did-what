"use client";

import { type Dispatch, type ReactNode, type SetStateAction, useState } from "react";

import type { RegionActivityMap } from "@/entities/region";
import { cn } from "@/shared/lib/utils";
import { BottomSheet } from "@/shared/ui/bottom-sheet";

import type { MapRecord } from "../model/record-map-points";
import { RegionRecordList } from "./region-record-list";

const SHEET_HEIGHT = "calc(100dvh - env(safe-area-inset-top) - 16px - var(--drawer-keyboard-inset, 0px))";

export type RegionRecordDetailRenderer = (props: {
  draft: string;
  onBack: () => void;
  onDraftChange: Dispatch<SetStateAction<string>>;
  recordId: string;
}) => ReactNode;

type RegionRecordsBottomSheetProps = {
  detailRecordId: string | null;
  onBeforeDetailOpen: () => void;
  onCloseComplete: () => void;
  onDetailBack: () => void;
  onOpenChange: (open: boolean) => void;
  onRecordOpen: (recordId: string) => void;
  onSubregionChange: (subregion: string | null) => void;
  open: boolean;
  records: readonly MapRecord[];
  region: RegionActivityMap | null;
  renderRecordDetail: RegionRecordDetailRenderer;
  subregion: string | null;
};

export function RegionRecordsBottomSheet({
  detailRecordId,
  onBeforeDetailOpen,
  onCloseComplete,
  onDetailBack,
  onOpenChange,
  onRecordOpen,
  onSubregionChange,
  open,
  records,
  region,
  renderRecordDetail,
  subregion,
}: RegionRecordsBottomSheetProps) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const isDetail = Boolean(detailRecordId);
  // 기록 작성 funnel과 같은 단계 모션이다. 시트가 열리고 닫힐 때는 시트 모션만 보이도록 열린 동안의 전환에만 방향을 준다.
  const [previousIsDetail, setPreviousIsDetail] = useState(isDetail);
  const [direction, setDirection] = useState<"forward" | "backward" | null>(null);
  if (previousIsDetail !== isDetail) {
    setPreviousIsDetail(isDetail);
    setDirection(open ? (isDetail ? "forward" : "backward") : null);
  }
  const handleOpenChangeComplete = (nextOpen: boolean) => {
    if (nextOpen) return;
    setDrafts({});
    setDirection(null);
    onCloseComplete();
  };
  const handleRecordOpen = (recordId: string) => {
    onBeforeDetailOpen();
    onRecordOpen(recordId);
  };

  return (
    <BottomSheet
      onOpenChange={onOpenChange}
      onOpenChangeComplete={handleOpenChangeComplete}
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
            {/* 상세에 있는 동안에도 목록을 그대로 두어, 돌아왔을 때 보던 스크롤 위치에서 이어 본다. */}
            <div
              className={cn("flex min-h-0 flex-1 flex-col pt-7", isDetail && "invisible absolute inset-0")}
              data-direction={isDetail ? undefined : (direction ?? undefined)}
              data-funnel-step
              inert={isDetail}
              key={region?.code}
            >
              <RegionRecordList
                records={records}
                region={region}
                subregion={subregion}
                onSubregionChange={onSubregionChange}
                onRecordOpen={handleRecordOpen}
                isDetail={isDetail}
              />
            </div>
            {detailRecordId ? (
              <div
                className="flex min-h-0 flex-1 flex-col"
                data-direction={direction ?? undefined}
                data-funnel-step
                key={detailRecordId}
              >
                {renderRecordDetail({
                  draft: drafts[detailRecordId] ?? "",
                  onBack: onDetailBack,
                  onDraftChange: (next) =>
                    setDrafts((current) => ({
                      ...current,
                      [detailRecordId]: typeof next === "function" ? next(current[detailRecordId] ?? "") : next,
                    })),
                  recordId: detailRecordId,
                })}
              </div>
            ) : null}
          </div>
        </BottomSheet.Content>
      </BottomSheet.VirtualKeyboardProvider>
    </BottomSheet>
  );
}
