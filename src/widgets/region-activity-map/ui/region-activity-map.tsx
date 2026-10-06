"use client";

import { useEffect, useMemo, useState } from "react";

import { Select } from "@base-ui/react/select";
import { CaretDownIcon } from "@phosphor-icons/react";
import { useFunnel } from "@use-funnel/browser";
import { useSearchParams } from "next/navigation";

import { createKoreaMap, getKoreaMapFrame, getRegion, KOREA_MAP_CELL_STYLE, type Region } from "@/entities/region";
import { cn } from "@/shared/lib/utils";
import { LiquidGlassButton } from "@/shared/ui/liquid-glass-button";
import { readMapUrlState, toMapSearch } from "@/widgets/region-activity-map/model/map-url-state";
import {
  type MapRecord,
  REGION_BADGE_ANCHORS,
  toRecordMapPoints,
} from "@/widgets/region-activity-map/model/record-map-points";
import { useCurrentMapLocation } from "@/widgets/region-activity-map/model/use-current-map-location";
import { useMapViewport } from "@/widgets/region-activity-map/model/use-map-viewport";
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
// 핀치하는 동안 매 프레임 주소를 바꾸지 않도록 움직임이 멈춘 뒤에 쓴다. iOS는 짧은 시간에 너무 자주 바꾸면 막는다.
const URL_WRITE_DELAY = 250;
const FUNNEL_ID = "map-record-sheet";
const REGION_SHORTCUTS = Object.entries(REGION_BADGE_ANCHORS).sort(([, first], [, second]) =>
  first.label.localeCompare(second.label, "ko"),
);
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
  const initialFunnel = useMemo(
    () => ({ step: initialUrlState.region ? ("list" as const) : ("map" as const), context: { recordId: null } }),
    [initialUrlState.region],
  );
  const funnel = useFunnel<MapRecordSheetSteps>({ id: FUNNEL_ID, initial: initialFunnel, disableCleanup: true });
  const bottomSheetOpen = funnel.step !== "map" && selectedRegion !== null && !sheetClosing;
  const points = useMemo(() => toRecordMapPoints(records), [records]);
  const map = useMemo(() => createKoreaMap(points), [points]);
  // 확대·이동 중에는 같은 셀 요소를 재사용해 1,250개 셀을 매 프레임 다시 만들지 않는다.
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
  const viewport = useMapViewport(map, HOME_FRAME, initialUrlState.view);
  const currentLocation = useCurrentMapLocation(viewport.focusOn);

  const urlRegion = bottomSheetOpen ? (selectedRegion?.code ?? null) : null;
  const urlSubregion = urlRegion ? subregion : null;
  const urlView = viewport.view;

  // 떠나는 순간에 쓰면 이미 바뀐 다음 화면 주소를 덮을 수 있어, 화면을 떠나면 예약한 쓰기를 취소한다.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const search = toMapSearch(window.location.search, { region: urlRegion, subregion: urlSubregion, view: urlView });
      if (search === window.location.search) return;
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${search}`);
    }, URL_WRITE_DELAY);
    return () => window.clearTimeout(timer);
  }, [urlRegion, urlSubregion, urlView]);

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
      view: viewport.view,
    });
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${search}`);
  };

  return (
    <>
      <nav
        aria-label="지역 바로가기"
        className="pointer-events-auto absolute top-(--page-top) left-5 z-30 flex h-(--toolbar-height) items-center"
      >
        <Select.Root<string> onValueChange={(code) => openRegion(getRegion(code ?? ""))} value={null}>
          <Select.Trigger
            aria-label="지역 선택"
            render={
              <LiquidGlassButton
                className="liquid-glass-control w-32 min-w-0 gap-2 px-3 focus-visible:ring-0"
                surface="group"
              />
            }
          >
            <Select.Value placeholder="지역 선택" />
            <CaretDownIcon aria-hidden="true" />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner align="start" alignItemWithTrigger={false} className="z-50" sideOffset={8}>
              <Select.Popup className="data-ending-style:transform-[scale(0.95)] data-starting-style:transform-[scale(0.95)] max-h-[min(60vh,28rem)] w-(--anchor-width) origin-(--transform-origin) overflow-y-auto rounded-2xl border border-border bg-surface p-1 shadow-lg transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] data-ending-style:pointer-events-none data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:duration-150 motion-reduce:transform-none motion-reduce:transition-opacity">
                <Select.List>
                  {REGION_SHORTCUTS.map(([code, { label }]) => (
                    <Select.Item
                      className="flex h-11 cursor-pointer items-center rounded-xl px-3 text-foreground text-sm outline-none data-[highlighted]:bg-muted"
                      key={code}
                      value={code}
                    >
                      <Select.ItemText>{label}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.List>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      </nav>
      <svg
        className={cn(
          // 지도가 상단 도구 막대와 하단 메뉴 사이에 꽉 차도록 그만큼 비워 둔다.
          "absolute inset-0 size-full touch-none overflow-hidden px-5 pt-[calc(var(--page-top)+var(--toolbar-height)+76px)] pb-(--nav-clearance) [shape-rendering:geometricPrecision]",
          viewport.zoom > 1 && "cursor-grab active:cursor-grabbing",
        )}
        aria-labelledby="korea-map-title korea-map-description"
        preserveAspectRatio="xMidYMid meet"
        {...viewport.svgProps}
      >
        <title id="korea-map-title">대한민국 셀 기록 지도</title>
        <desc id="korea-map-description">
          {[
            records.length > 0
              ? `대한민국 지도 위에 기록 ${records.length}개를 둥근 사각형 셀의 농도로 표시한 지도.`
              : "아직 표시할 기록이 없는 대한민국 셀 지도.",
            "상단 지역 선택에서 지역 기록을 볼 수 있어요.",
            "두 손가락으로 확대하거나 축소하고, 확대된 지도는 한 손가락으로 이동할 수 있어요.",
            currentLocation.position ? "현재 위치가 원형 점으로 표시되어 있어요." : null,
          ]
            .filter(Boolean)
            .join(" ")}
        </desc>
        <rect {...viewport.visibleFrame} fill="transparent" pointerEvents="all" />
        <g aria-hidden="true" pointerEvents="none">
          {cells}
          {currentLocation.position ? (
            <>
              <circle
                cx={currentLocation.position.x}
                cy={currentLocation.position.y}
                r={10 * viewport.unitsPerPixel}
                className="map-location-pulse fill-primary/20"
              />
              <circle
                cx={currentLocation.position.x}
                cy={currentLocation.position.y}
                r={4 * viewport.unitsPerPixel}
                className="fill-primary stroke-background"
                strokeWidth={2 * viewport.unitsPerPixel}
              />
            </>
          ) : null}
        </g>
      </svg>
      <MapControls viewport={viewport} currentLocation={currentLocation} />
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
