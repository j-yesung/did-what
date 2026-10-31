import { type CSSProperties, type ReactNode, useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { recordLocationsQueryOptions, toRegionLocations } from "@/entities/record";
import { createRegionActivityMaps } from "@/entities/region";
import { BottomSheet, FULL_SHEET_HEIGHT } from "@/shared/ui/bottom-sheet";
import { Button } from "@/shared/ui/button";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { RegionRecordList } from "@/widgets/region-activity-map/ui/region-record-list";

import type { JourneyRegion } from "../../model/types";
import styles from "../journey-map.module.css";
import { HomeLoadError } from "../panel/journey-notices";
import { SHEET_BODY_CLASS, SheetHeader, SheetNavigation } from "./region-choices";

type JourneySheetProps = {
  open: boolean;
  onClose: () => void;
  onCloseComplete: () => void;
  finalFocus: () => HTMLElement | boolean | null;
  children: ReactNode;
};

export function JourneySheet({ open, onClose, onCloseComplete, finalFocus, children }: JourneySheetProps) {
  return (
    <BottomSheet
      snapPoints={[1]}
      open={open}
      onOpenChangeComplete={(nextOpen) => {
        if (!nextOpen) onCloseComplete();
      }}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      showSwipeHandle
    >
      <BottomSheet.Content
        className={`dark ${styles.sheet} motion-safe:duration-250 motion-safe:ease-[cubic-bezier(0.32,0.72,0,1)]`}
        style={{ "--drawer-content-max-height": FULL_SHEET_HEIGHT } as CSSProperties}
        finalFocus={finalFocus}
      >
        {children}
      </BottomSheet.Content>
    </BottomSheet>
  );
}

type RegionRecordsProps = {
  region: JourneyRegion | null;
  homeReady: boolean;
  homeUnavailable: boolean;
  currentRecordId?: string;
  subregion: string | null;
  onBack: () => void;
  onSubregionChange: (subregion: string | null) => void;
  onRecordOpen: (recordId: string) => void;
  onRecordPress: (recordId: string) => void;
  onRegisterHome: () => void;
};

export function RegionRecords({
  region,
  homeReady,
  homeUnavailable,
  currentRecordId,
  subregion,
  onBack,
  onSubregionChange,
  onRecordOpen,
  onRecordPress,
  onRegisterHome,
}: RegionRecordsProps) {
  const locations = useQuery(recordLocationsQueryOptions);
  const regionMaps = useMemo(
    () => (locations.data ? createRegionActivityMaps(toRegionLocations(locations.data)) : []),
    [locations.data],
  );

  if (homeReady && locations.data && region)
    return (
      <>
        <SheetNavigation onBack={onBack} />
        <RegionRecordList
          isDetail={false}
          currentRecordId={currentRecordId}
          onRecordOpen={onRecordOpen}
          onRecordPress={onRecordPress}
          onSubregionChange={onSubregionChange}
          records={locations.data}
          region={regionMaps.find(({ code }) => code === region.code) ?? null}
          subregion={subregion}
        />
      </>
    );

  return (
    <>
      <SheetHeader title={region?.name ?? ""} onBack={onBack} />
      <div className={SHEET_BODY_CLASS}>
        {!homeReady && (
          <div className={styles.sheetNotice}>
            {homeUnavailable ? (
              <HomeLoadError />
            ) : (
              <>
                <p>기록까지 이어지는 길은 내 집에서 출발해요. 집 주소를 먼저 등록해 주세요.</p>
                <Button onClick={onRegisterHome} size="large">
                  집 주소 등록하기
                </Button>
              </>
            )}
          </div>
        )}
        {homeReady && locations.isPending && (
          <div className={styles.skeleton} aria-label="기록을 불러오는 중">
            <i />
            <i />
            <i />
          </div>
        )}
        {homeReady && locations.isError && (
          <LoadErrorAlert
            title="기록을 불러오지 못했어요."
            onRetry={() => void locations.refetch()}
            retrying={locations.isFetching}
          />
        )}
      </div>
    </>
  );
}
