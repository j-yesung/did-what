import { CaretRightIcon } from "@phosphor-icons/react";

import { ICON_WEIGHT_MEDIUM } from "@/shared/lib/interaction";
import { cn } from "@/shared/lib/utils";
import { BackButton } from "@/shared/ui/back-button";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { ListRow, ListRowTexts } from "@/shared/ui/list-row";

import type { JourneyRegion } from "../../model/types";

type SheetHeaderProps = {
  title: string;
  onBack?: () => void;
};

export function SheetNavigation({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex shrink-0 items-center justify-between px-3 pt-3">
      <BackButton aria-label="지역 목록으로" onClick={onBack} />
      <BottomSheet.CloseButton
        label="기록 목록 닫기"
        className={cn("static [&_button]:size-(--toolbar-height) [&_button_svg]:size-6.75", ICON_WEIGHT_MEDIUM)}
      />
    </div>
  );
}

export function SheetHeader({ title, onBack }: SheetHeaderProps) {
  return (
    <>
      {onBack && <SheetNavigation onBack={onBack} />}
      <BottomSheet.Header className="relative text-left group-data-[swipe-axis=y]/bottom-sheet-popup:text-left">
        {!onBack && <BottomSheet.CloseButton label="목록 닫기" className="top-1" />}
        <BottomSheet.Title className={cn("text-left font-bold text-xl", !onBack && "pr-12")}>{title}</BottomSheet.Title>
      </BottomSheet.Header>
    </>
  );
}

export const SHEET_BODY_CLASS = "min-h-0 overflow-y-auto px-5 pt-4 pb-[calc(--spacing(8)+env(safe-area-inset-bottom))]";

type RegionChoicesProps = {
  kind: "regions" | "choices";
  regions: JourneyRegion[];
  onRegion: (region: JourneyRegion) => void;
  selectedRegionCode?: string;
};

const TITLES = {
  regions: "방문한 지역",
  choices: "어느 지역의 기록을 볼까요?",
};

export function RegionChoices({ kind, regions, onRegion, selectedRegionCode }: RegionChoicesProps) {
  return (
    <>
      <SheetHeader title={TITLES[kind]} />
      <div className={SHEET_BODY_CLASS}>
        {regions.map((item) => (
          <ListRow
            key={item.code}
            autoFocus={item.code === selectedRegionCode}
            className="px-3"
            onClick={() => onRegion(item)}
            right={<CaretRightIcon aria-hidden="true" size={20} />}
          >
            <ListRowTexts description={`기록 ${item.count}개`} title={item.name} />
          </ListRow>
        ))}
      </div>
    </>
  );
}
