"use client";

import { useEffect, useMemo, useState } from "react";

import { useFunnel } from "@use-funnel/browser";
import { useSearchParams } from "next/navigation";

import { toRegionLocations } from "@/entities/record";
import {
  createKoreaMap,
  createRegionActivityMaps,
  getKoreaMapFrame,
  getRegion,
  KOREA_MAP_CELL_STYLE,
  type Region,
  RegionMiniMap,
} from "@/entities/region";
import { SegmentedControl, SegmentedControlItem } from "@/shared/ui/segmented-control";
import { readMapUrlState, toMapSearch } from "@/widgets/region-activity-map/model/map-url-state";
import {
  type MapRecord,
  REGION_BADGE_ANCHORS,
  toRecordMapPoints,
} from "@/widgets/region-activity-map/model/record-map-points";
import { getRegionRecordCounts } from "@/widgets/region-activity-map/model/region-visit-summary";
import { useCurrentMapLocation } from "@/widgets/region-activity-map/model/use-current-map-location";
import { MapControls } from "@/widgets/region-activity-map/ui/map-controls";
import {
  type RegionRecordDetailRenderer,
  RegionRecordsBottomSheet,
} from "@/widgets/region-activity-map/ui/region-records-bottom-sheet";

const LEVEL_CLASS_NAMES = {
  0: "fill-map-empty",
  1: "fill-map-level-1",
  2: "fill-map-level-2",
  3: "fill-map-level-3",
  4: "fill-map-level-4",
} as const;
// 첫 화면은 본토와 제주 주변에 한 단계 여백을 두어 지도의 전체 윤곽을 보기 쉽게 한다.
const HOME_FRAME = getKoreaMapFrame({ east: 130.2, north: 39.4, south: 32.4, west: 125.5 });
const FUNNEL_ID = "map-record-sheet";
type MapRecordSheetSteps = {
  map: { recordId: null };
  list: { recordId: null };
  detail: { recordId: string };
};

export function RegionActivityMap({
  records,
  renderRecordDetail,
}: {
  records: readonly MapRecord[];
  renderRecordDetail: RegionRecordDetailRenderer;
}) {
  const searchParams = useSearchParams();
  const [initialUrlState] = useState(() => {
    const state = readMapUrlState(searchParams);
    return { ...state, region: state.region ? (getRegion(state.region) ?? null) : null };
  });
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(initialUrlState.region);
  const [subregion, setSubregion] = useState(initialUrlState.subregion);
  const [sheetClosing, setSheetClosing] = useState(false);
  const [showAllRegions, setShowAllRegions] = useState(false);
  const initialFunnel = useMemo(
    () => ({ step: initialUrlState.region ? ("list" as const) : ("map" as const), context: { recordId: null } }),
    [initialUrlState.region],
  );
  const funnel = useFunnel<MapRecordSheetSteps>({ id: FUNNEL_ID, initial: initialFunnel, disableCleanup: true });
  const bottomSheetOpen = funnel.step !== "map" && selectedRegion !== null && !sheetClosing;
  const points = useMemo(() => toRecordMapPoints(records), [records]);
  const map = useMemo(() => createKoreaMap(points), [points]);
  const regionMaps = useMemo(() => {
    const counts = getRegionRecordCounts(records);
    return createRegionActivityMaps(toRegionLocations(records))
      .map((regionMap) => ({ ...regionMap, recordCount: counts.get(regionMap.code) ?? 0 }))
      .sort((first, second) => second.recordCount - first.recordCount);
  }, [records]);
  const visitedRegions = regionMaps.filter(({ recordCount }) => recordCount > 0);
  const visibleRegions = showAllRegions || visitedRegions.length === 0 ? regionMaps : visitedRegions;
  // 시트를 열고 닫을 때 전국 지도의 셀 요소는 재사용한다.
  const cells = useMemo(
    () =>
      map.cells.map((cell) => (
        <rect
          className={LEVEL_CLASS_NAMES[cell.level]}
          height={KOREA_MAP_CELL_STYLE.size}
          key={cell.id}
          rx={KOREA_MAP_CELL_STYLE.radius}
          width={KOREA_MAP_CELL_STYLE.size}
          x={cell.x}
          y={cell.y}
        />
      )),
    [map],
  );
  const currentLocation = useCurrentMapLocation();

  const urlRegion = bottomSheetOpen ? (selectedRegion?.code ?? null) : null;
  const urlSubregion = urlRegion ? subregion : null;

  useEffect(() => {
    const search = toMapSearch(window.location.search, { region: urlRegion, subregion: urlSubregion });
    if (search === window.location.search) return;
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${search}`);
  }, [urlRegion, urlSubregion]);

  const openRegion = (region: Region | undefined) => {
    if (!region) return;
    // 다른 시·도를 열면 이전 시·도에서 고른 시·군·구는 버린다.
    if (region.code !== selectedRegion?.code) setSubregion(null);
    setSelectedRegion(region);
    if (funnel.step === "map") {
      void funnel.history.push("list", { recordId: null });
      saveMapUrl(region.code, null);
    }
  };

  const saveMapUrl = (regionCode: string | null, nextSubregion: string | null) => {
    const search = toMapSearch(window.location.search, {
      region: regionCode,
      subregion: nextSubregion,
    });
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${search}`);
  };

  return (
    <>
      <div className="-mx-5">
        <svg
          className="h-[clamp(480px,68svh,580px)] w-full [shape-rendering:geometricPrecision]"
          aria-labelledby="korea-map-title korea-map-description"
          preserveAspectRatio="xMidYMid meet"
          viewBox={`${HOME_FRAME.x} ${HOME_FRAME.y} ${HOME_FRAME.width} ${HOME_FRAME.height}`}
        >
          <title id="korea-map-title">대한민국 셀 기록 지도</title>
          <desc id="korea-map-description">
            {records.length > 0
              ? `대한민국 지도 위에 기록 ${records.length}개를 둥근 사각형 셀의 농도로 표시한 지도.`
              : "아직 표시할 기록이 없는 대한민국 셀 지도."}
            아래 미니 지도를 누르면 해당 지역의 기록을 볼 수 있어요.
            {currentLocation.position ? "현재 위치가 원형 점으로 표시되어 있어요." : null}
          </desc>
          <g aria-hidden="true">
            {cells}
            {currentLocation.position ? (
              <>
                <circle
                  cx={currentLocation.position.x}
                  cy={currentLocation.position.y}
                  r={6}
                  className="map-location-pulse fill-primary/20"
                />
                <circle
                  cx={currentLocation.position.x}
                  cy={currentLocation.position.y}
                  r={2.5}
                  className="fill-primary stroke-background"
                  strokeWidth={1.2}
                />
              </>
            ) : null}
          </g>
        </svg>
        <MapControls currentLocation={currentLocation} />
      </div>
      <section className="mt-5" aria-labelledby="region-memories-title">
        <div className="mb-3 flex min-h-11 items-center justify-between gap-2">
          <h2 className="font-semibold text-lg" id="region-memories-title">
            지역별 기억
          </h2>
          {visitedRegions.length > 0 && visitedRegions.length < regionMaps.length ? (
            <SegmentedControl
              aria-label="지역 표시 범위"
              aria-controls="region-shortcuts"
              className="w-28 shrink-0"
              name="home-region-scope"
              onValueChange={(value) => setShowAllRegions(value === "all")}
              size="small"
              value={showAllRegions ? "all" : "visited"}
            >
              <SegmentedControlItem value="visited">방문</SegmentedControlItem>
              <SegmentedControlItem value="all">전체</SegmentedControlItem>
            </SegmentedControl>
          ) : null}
        </div>
        <ul className="grid grid-cols-3 gap-2.5" id="region-shortcuts">
          {visibleRegions.map((regionMap) => {
            const label = REGION_BADGE_ANCHORS[regionMap.code].label;
            return (
              <li className="min-w-0" key={regionMap.code}>
                <button
                  aria-label={`${label}, 기록 ${regionMap.recordCount}개, 지역 기록 보기`}
                  aria-haspopup="dialog"
                  className="relative flex w-full cursor-pointer flex-col gap-3 rounded-2xl border border-border bg-surface px-3 py-4 text-left after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:bg-dark-weak after:opacity-0 after:transition-opacity hover:after:opacity-100 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 active:after:opacity-100"
                  onClick={() => openRegion(regionMap)}
                  type="button"
                >
                  <div className="h-18 w-full">
                    <RegionMiniMap map={regionMap} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-sm">{label}</span>
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {regionMap.recordCount > 0 ? `기록 ${regionMap.recordCount}개` : "아직 기록 없음"}
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
      <RegionRecordsBottomSheet
        detailRecordId={funnel.step === "detail" ? funnel.context.recordId : null}
        onBeforeDetailOpen={() => saveMapUrl(selectedRegion?.code ?? null, subregion)}
        onCloseComplete={() => {
          if (!sheetClosing) return;
          void funnel.history.replace("map", { recordId: null });
          saveMapUrl(null, null);
          setSheetClosing(false);
        }}
        onDetailBack={() => void funnel.history.back()}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setSheetClosing(true);
        }}
        onRecordOpen={(recordId) => void funnel.history.push("detail", { recordId })}
        onSubregionChange={setSubregion}
        open={bottomSheetOpen}
        records={records}
        region={selectedRegion}
        renderRecordDetail={renderRecordDetail}
        subregion={subregion}
      />
    </>
  );
}
