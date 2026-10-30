import { CaretRightIcon, XIcon } from "@phosphor-icons/react";

import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { IconButton } from "@/shared/ui/icon-button";
import { ListRow, ListRowTexts } from "@/shared/ui/list-row";

import type { JourneyRegion } from "../../model/types";

type SheetHeaderProps = {
  title: string;
  description?: string;
};

export function SheetHeader({ title, description }: SheetHeaderProps) {
  return (
    <BottomSheet.Header className="relative text-left group-data-[swipe-axis=y]/bottom-sheet-popup:text-left">
      <BottomSheet.Close
        render={<IconButton aria-label="목록 닫기" icon={XIcon} className="absolute top-2 right-3" />}
      />
      <BottomSheet.Title className="pr-10 text-left font-bold text-xl">{title}</BottomSheet.Title>
      {description && <BottomSheet.Description>{description}</BottomSheet.Description>}
    </BottomSheet.Header>
  );
}

export const SHEET_BODY_CLASS = "min-h-0 overflow-y-auto px-5 pt-4 pb-[calc(--spacing(8)+env(safe-area-inset-bottom))]";

type RegionChoicesProps = {
  kind: "regions" | "choices";
  regions: JourneyRegion[];
  onRegion: (region: JourneyRegion) => void;
};

const TITLES = {
  regions: "방문한 지역",
  choices: "어느 지역의 기록을 볼까요?",
};

export function RegionChoices({ kind, regions, onRegion }: RegionChoicesProps) {
  return (
    <>
      <SheetHeader
        title={TITLES[kind]}
        description={kind === "regions" ? "다시 보고 싶은 지역을 선택해 주세요." : undefined}
      />
      <div className={SHEET_BODY_CLASS}>
        {regions.map((item) => (
          <ListRow
            key={item.code}
            className="px-1"
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
