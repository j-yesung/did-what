"use client";

import { type MouseEvent, type PointerEvent, useEffect, useMemo, useRef, useState } from "react";

import { useFunnel } from "@use-funnel/browser";
import { useSearchParams } from "next/navigation";

import {
  createKoreaMap,
  getKoreaMapFrame,
  getRegion,
  KOREA_MAP_CELL_STYLE,
  KOREA_MAP_REGION_PATHS,
  type Region,
} from "@/entities/region";
import { cn } from "@/shared/lib/utils";
import { readMapUrlState, toMapSearch } from "@/widgets/region-activity-map/model/map-url-state";
import { type MapRecord, toRecordMapPoints } from "@/widgets/region-activity-map/model/record-map-points";
import { useCurrentMapLocation } from "@/widgets/region-activity-map/model/use-current-map-location";
import { useMapViewport } from "@/widgets/region-activity-map/model/use-map-viewport";
import { MapControls } from "@/widgets/region-activity-map/ui/map-controls";
import { RegionRecordsBottomSheet } from "@/widgets/region-activity-map/ui/region-records-bottom-sheet";

const LEVEL_CLASS_NAMES = {
  0: "fill-map-empty",
  1: "fill-map-level-1",
  2: "fill-map-level-2",
  3: "fill-map-level-3",
  4: "fill-map-level-4",
} as const;
const TAP_SLOP = 8;
// 첫 화면은 본토와 제주만 꽉 차게 담는다. 백령도·울릉도는 옆으로 옮기거나 축소하면 보인다.
const HOME_FRAME = getKoreaMapFrame({ east: 129.7, north: 38.7, south: 33.1, west: 126 });
// 핀치하는 동안 매 프레임 주소를 바꾸지 않도록 움직임이 멈춘 뒤에 쓴다. iOS는 짧은 시간에 너무 자주 바꾸면 막는다.
const URL_WRITE_DELAY = 250;
const FUNNEL_ID = "map-record-sheet";
type MapRecordSheetSteps = {
  map: { recordId: null };
  list: { recordId: null };
  detail: { recordId: string };
};

// 보이지 않는 지역 경계가 셀 사이 여백까지 포함해 터치를 받는다.
const findRegionAt = (clientX: number, clientY: number) => {
  for (const element of document.elementsFromPoint(clientX, clientY)) {
    const code = element.closest<SVGElement>("[data-region-code]")?.dataset.regionCode;
    if (code) return getRegion(code);
  }
};

export function RegionActivityMap({
  member,
  records,
}: {
  member: { id: string; name: string };
  records: readonly MapRecord[];
}) {
  const searchParams = useSearchParams();
  // 기록을 보고 돌아오면 주소에 남겨 둔 시트·칩·확대 상태로 이어서 보여준다. 달력의 ?date=와 같은 방식이다.
  const [initialUrlState] = useState(() => {
    const state = readMapUrlState(searchParams);
    return { ...state, region: state.region ? (getRegion(state.region) ?? null) : null };
  });
  const pressRef = useRef<{ x: number; y: number } | null>(null);
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
  const highlightedRegion = bottomSheetOpen ? selectedRegion?.code : null;
  // 확대·이동 중에는 같은 셀 요소를 재사용해 1,250개 셀을 매 프레임 다시 만들지 않는다.
  const cells = useMemo(
    () =>
      map.cells.map((cell) => (
        <rect
          className={cn(LEVEL_CLASS_NAMES[cell.level], cell.regionCode === highlightedRegion && "stroke-primary")}
          height={KOREA_MAP_CELL_STYLE.size}
          key={cell.id}
          rx={KOREA_MAP_CELL_STYLE.radius}
          strokeWidth={0.5}
          width={KOREA_MAP_CELL_STYLE.size}
          x={cell.x}
          y={cell.y}
        />
      )),
    [map, highlightedRegion],
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

  // 포인터 캡처 때문에 경계에서 click이 오지 않아, 실제 누른 자리에 있는 시·도를 찾는다.
  const selectRegion = (event: MouseEvent) => {
    const press = pressRef.current;
    if (!press || Math.hypot(event.clientX - press.x, event.clientY - press.y) > TAP_SLOP) return;
    openRegion(findRegionAt(event.clientX, event.clientY));
  };

  return (
    <>
      <div className="pointer-events-none absolute top-[calc(var(--page-top)+var(--toolbar-height)+16px)] left-5 z-10">
        <h1 className="font-bold text-xl tracking-tight">함께 쌓인 지도</h1>
      </div>
      <svg
        className={cn(
          // 지도가 상단 도구 막대와 하단 메뉴 사이에 꽉 차도록 그만큼 비워 둔다.
          "absolute inset-0 size-full touch-none overflow-hidden px-5 pt-[calc(var(--page-top)+var(--toolbar-height)+76px)] pb-(--nav-clearance) [shape-rendering:geometricPrecision]",
          viewport.zoom > 1 && "cursor-grab active:cursor-grabbing",
        )}
        aria-labelledby="korea-map-title korea-map-description"
        preserveAspectRatio="xMidYMid meet"
        {...viewport.svgProps}
        onClick={selectRegion}
        onPointerCancel={(event: PointerEvent<SVGSVGElement>) => {
          pressRef.current = null;
          viewport.svgProps.onPointerCancel(event);
        }}
        onPointerDown={(event: PointerEvent<SVGSVGElement>) => {
          pressRef.current = event.isPrimary ? { x: event.clientX, y: event.clientY } : null;
          viewport.svgProps.onPointerDown(event);
        }}
        onPointerMove={(event: PointerEvent<SVGSVGElement>) => {
          const press = pressRef.current;
          if (press && Math.hypot(event.clientX - press.x, event.clientY - press.y) > TAP_SLOP) pressRef.current = null;
          viewport.svgProps.onPointerMove(event);
        }}
        onPointerUp={(event: PointerEvent<SVGSVGElement>) => {
          viewport.svgProps.onPointerUp(event);
        }}
      >
        <title id="korea-map-title">대한민국 셀 기록 지도</title>
        <desc id="korea-map-description">
          {[
            records.length > 0
              ? `대한민국 지도 위에 기록 ${records.length}개를 둥근 사각형 셀의 농도로 표시한 지도.`
              : "아직 표시할 기록이 없는 대한민국 셀 지도.",
            "작은 셀이나 셀 사이 여백을 포함한 지역 전체를 누르면 그 지역 기록을 볼 수 있어요.",
            "두 손가락으로 확대하거나 축소하고, 확대된 지도는 한 손가락으로 이동할 수 있어요.",
            currentLocation.position ? "현재 위치가 원형 점으로 표시되어 있어요." : null,
          ]
            .filter(Boolean)
            .join(" ")}
        </desc>
        <g>
          {KOREA_MAP_REGION_PATHS.map(({ code, key, path }) => (
            <path
              aria-label={`${getRegion(code)?.name ?? "지역"} 기록 보기`}
              className="cursor-pointer fill-transparent outline-none focus-visible:stroke-primary"
              d={path}
              data-region-code={code}
              fillRule="evenodd"
              key={key}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                openRegion(getRegion(code));
              }}
              role="button"
              strokeLinejoin="round"
              strokeWidth={2}
              tabIndex={0}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
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
        member={member}
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
        subregion={subregion}
      />
    </>
  );
}
