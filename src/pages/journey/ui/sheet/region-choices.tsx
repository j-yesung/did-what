import type { Ref } from "react";

import { CaretRightIcon, XIcon } from "@phosphor-icons/react";

import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { Button } from "@/shared/ui/button";
import { IconButton } from "@/shared/ui/icon-button";
import { ListRow, ListRowTexts } from "@/shared/ui/list-row";

import type { JourneyPlace, JourneyRegion } from "../../model/types";

type SheetHeaderProps = {
  ref?: Ref<HTMLDivElement>;
  title: string;
  description?: string;
};

export function SheetHeader({ ref, title, description }: SheetHeaderProps) {
  return (
    <BottomSheet.Header ref={ref} className="relative text-left group-data-[swipe-axis=y]/bottom-sheet-popup:text-left">
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
  kind: "regions" | "choices" | "places";
  regions: JourneyRegion[];
  places: JourneyPlace[];
  headerRef: Ref<HTMLDivElement>;
  bodyRef: Ref<HTMLDivElement>;
  onRegion: (region: JourneyRegion) => void;
  onPlace: (place: JourneyPlace) => void;
  onPlacesTogether: () => void;
};

const TITLES = {
  regions: "방문한 지역",
  choices: "어느 지역의 기록을 볼까요?",
};

export function RegionChoices({
  kind,
  regions,
  places,
  headerRef,
  bodyRef,
  onRegion,
  onPlace,
  onPlacesTogether,
}: RegionChoicesProps) {
  return (
    <>
      <SheetHeader
        ref={headerRef}
        title={kind === "places" ? `여기에 함께한 장소 ${places.length}곳` : TITLES[kind]}
        description={kind === "regions" ? "다시 보고 싶은 지역을 선택해 주세요." : undefined}
      />
      <div ref={bodyRef} className={SHEET_BODY_CLASS}>
        {kind === "places" ? (
          <>
            {places.map((place, index) => (
              <ListRow
                key={place.id}
                className="px-1"
                onClick={() => onPlace(place)}
                right={<CaretRightIcon aria-hidden="true" size={20} />}
              >
                <ListRowTexts title={place.name} description={`장소 ${index + 1}`} />
              </ListRow>
            ))}
            <Button className="mt-4" fullWidth size="large" onClick={onPlacesTogether}>
              지도에서 따로 보기
            </Button>
          </>
        ) : (
          regions.map((item) => (
            <ListRow
              key={item.code}
              className="px-1"
              onClick={() => onRegion(item)}
              right={<CaretRightIcon aria-hidden="true" size={20} />}
            >
              <ListRowTexts description={`기록 ${item.count}개`} title={item.name} />
            </ListRow>
          ))
        )}
      </div>
    </>
  );
}
