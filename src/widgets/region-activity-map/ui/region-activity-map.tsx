"use client";

import { type MouseEvent, type PointerEvent, useMemo, useRef, useState } from "react";

import {
  createKoreaMap,
  getKoreaMapFrame,
  getKoreaMapPosition,
  getRegion,
  getRegionCode,
  KOREA_MAP_CELL_STYLE,
  KOREA_MAP_DOT_RADIUS,
  KOREA_MAP_REGION_PATHS,
  type Region,
} from "@/entities/region";
import { cn } from "@/shared/lib/utils";
import {
  BADGE_FONT_SIZE,
  type MapRecord,
  OVERVIEW_BADGE_LIMIT,
  placeRegionBadges,
  REGION_BADGE_ANCHORS,
  type RegionCode,
  toRecordMapPoints,
} from "@/widgets/region-activity-map/model/record-map-points";
import { useCurrentMapLocation } from "@/widgets/region-activity-map/model/use-current-map-location";
import { useMapViewport } from "@/widgets/region-activity-map/model/use-map-viewport";
import { MapControls } from "@/widgets/region-activity-map/ui/map-controls";
import { RegionRecordsBottomSheet } from "@/widgets/region-activity-map/ui/region-records-bottom-sheet";

const LEVEL_CLASS_NAMES = {
  1: "fill-map-level-1",
  2: "fill-map-level-2",
  3: "fill-map-level-3",
  4: "fill-map-level-4",
} as const;
const CELL_CENTER = KOREA_MAP_CELL_STYLE.size / 2;
const TAP_SLOP = 8;
// 첫 화면은 본토와 제주만 꽉 차게 담는다. 백령도·울릉도는 옆으로 옮기거나 축소하면 보인다.
const HOME_FRAME = getKoreaMapFrame({ east: 129.7, north: 38.7, south: 33.1, west: 126 });
// 첫 화면에서 이만큼 확대하기 전까지는 전국을 보는 중으로 보고 배지 수를 줄인다.
const OVERVIEW_ZOOM_RATIO = 1.5;

// 배지가 경계보다 위에 그려져 먼저 잡힌다. 배지 안의 글자를 눌러도 배지 묶음의 지역 코드를 찾는다.
const findRegionAt = (clientX: number, clientY: number) => {
  for (const element of document.elementsFromPoint(clientX, clientY)) {
    const code = element.closest<SVGElement>("[data-region-code]")?.dataset.regionCode;
    if (code) return getRegion(code);
  }
};

export function RegionActivityMap({ records }: { records: readonly MapRecord[] }) {
  const pressRef = useRef<{ x: number; y: number } | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [pressedBadge, setPressedBadge] = useState<string | null>(null);
  const points = useMemo(() => toRecordMapPoints(records), [records]);
  const map = useMemo(() => createKoreaMap(points), [points]);
  const dots = useMemo(() => map.cells.filter((cell) => cell.level > 0), [map]);
  const viewport = useMapViewport(map, HOME_FRAME);
  const currentLocation = useCurrentMapLocation(viewport.focusOn);
  const dotScale = 1 / Math.sqrt(viewport.zoom);
  const regionCounts = useMemo(() => {
    const counts = new Map<RegionCode, number>();
    for (const record of records) {
      const codes = new Set(record.record_regions.map(({ region_code }) => getRegionCode(region_code)));
      for (const code of codes) if (code) counts.set(code, (counts.get(code) ?? 0) + 1);
    }
    return counts;
  }, [records]);
  const badges = useMemo(
    () =>
      placeRegionBadges(
        [...regionCounts].flatMap(([code, count]) => {
          const anchor = REGION_BADGE_ANCHORS[code];
          const position = getKoreaMapPosition(anchor);
          return position ? [{ code, count, label: anchor.label, ...position }] : [];
        }),
        viewport.unitsPerPixel,
        viewport.zoom < viewport.homeZoom * OVERVIEW_ZOOM_RATIO ? OVERVIEW_BADGE_LIMIT : undefined,
      ),
    [regionCounts, viewport.unitsPerPixel, viewport.zoom, viewport.homeZoom],
  );

  const openRegion = (region: Region | undefined) => {
    if (!region) return;
    setSelectedRegion(region);
    setBottomSheetOpen(true);
  };

  // 뷰포트가 포인터를 svg에 붙잡아 경계에서 click이 오지 않으므로, 누른 자리의 배지나 경계를 직접 찾는다.
  // 점이 촘촘해 하나씩 누르기 어려우니 누른 자리가 속한 시·도 전체를 고른다.
  const selectRegion = (event: MouseEvent) => {
    const press = pressRef.current;
    if (!press || Math.hypot(event.clientX - press.x, event.clientY - press.y) > TAP_SLOP) return;
    openRegion(findRegionAt(event.clientX, event.clientY));
  };

  return (
    <>
      <svg
        className={cn(
          // 지도가 상단 도구 막대와 하단 메뉴 사이에 꽉 차도록 그만큼 비워 둔다.
          "absolute inset-0 size-full touch-none overflow-hidden px-1.5 pt-[calc(var(--page-top)+var(--toolbar-height))] pb-(--nav-clearance) [shape-rendering:geometricPrecision]",
          viewport.zoom > 1 && "cursor-grab active:cursor-grabbing",
        )}
        aria-labelledby="korea-map-title korea-map-description"
        preserveAspectRatio="xMidYMid meet"
        {...viewport.svgProps}
        onClick={selectRegion}
        // 배지 누름은 CSS :active 대신 여기서 잡는다. 뷰포트가 포인터를 svg에 붙잡아 :active가 배지에 남는다고 장담할 수 없다.
        // 두 번째 손가락이 닿거나 누른 채 움직이면 지도를 다루는 중이라 누름을 푼다.
        onPointerCancel={(event: PointerEvent<SVGSVGElement>) => {
          setPressedBadge(null);
          viewport.svgProps.onPointerCancel(event);
        }}
        onPointerDown={(event: PointerEvent<SVGSVGElement>) => {
          pressRef.current = { x: event.clientX, y: event.clientY };
          const badge = event.isPrimary && event.target instanceof Element && event.target.closest("[data-badge]");
          setPressedBadge(badge instanceof SVGElement ? (badge.dataset.regionCode ?? null) : null);
          viewport.svgProps.onPointerDown(event);
        }}
        onPointerMove={(event: PointerEvent<SVGSVGElement>) => {
          const press = pressRef.current;
          if (pressedBadge && press && Math.hypot(event.clientX - press.x, event.clientY - press.y) > TAP_SLOP) {
            setPressedBadge(null);
          }
          viewport.svgProps.onPointerMove(event);
        }}
        onPointerUp={(event: PointerEvent<SVGSVGElement>) => {
          setPressedBadge(null);
          viewport.svgProps.onPointerUp(event);
        }}
      >
        <title id="korea-map-title">대한민국 발자취 지도</title>
        {/* JSX는 줄바꿈으로 나눈 글과 표현식을 공백 없이 잇는다. 문장끼리 붙지 않게 직접 띄운다. */}
        <desc id="korea-map-description">
          {[
            records.length > 0
              ? `대한민국 지도 위에 기록 ${records.length}개를 점으로 표시한 지도. 지역 배지나 지역을 누르면 그 지역 기록을 볼 수 있어요.`
              : "아직 표시할 기록이 없는 대한민국 지도.",
            "두 손가락으로 확대하거나 축소하고, 확대된 지도는 한 손가락으로 이동할 수 있어요.",
            currentLocation.position ? "현재 위치가 원형 점으로 표시되어 있어요." : null,
          ]
            .filter(Boolean)
            .join(" ")}
        </desc>
        <g aria-hidden="true">
          {KOREA_MAP_REGION_PATHS.map(({ code, key, path }) => (
            <path
              className="fill-map-empty stroke-background"
              d={path}
              data-region-code={code}
              key={key}
              strokeLinejoin="round"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {dots.map((dot) => {
            const level = dot.level as keyof typeof KOREA_MAP_DOT_RADIUS;
            return (
              <circle
                className={LEVEL_CLASS_NAMES[level]}
                cx={dot.x + CELL_CENTER}
                cy={dot.y + CELL_CENTER}
                key={dot.id}
                r={KOREA_MAP_DOT_RADIUS[level] * dotScale}
              />
            );
          })}
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
        {/* 배지는 지도·점과 함께 첫 화면부터 그려지고, 확대해도 같은 크기로 보인다. 겹치는 배지는 확대하면 나타난다. */}
        {badges.map(({ code, count, height, label, left, path, top, width }) => (
          <g
            aria-label={`${label} 기록 ${count}개`}
            className={cn(
              // PRESS_FEEDBACK과 같은 누름: 0.97로 줄고, 누를 땐 80ms로 바로, 뗄 땐 350ms로 천천히 돌아온다.
              "group/badge origin-center cursor-pointer outline-none transition-transform duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)] [transform-box:fill-box] motion-reduce:scale-100",
              pressedBadge === code && "scale-[0.97] duration-[80ms] ease-out",
            )}
            data-badge=""
            data-region-code={code}
            key={code}
            onKeyDown={(event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              openRegion(getRegion(code));
            }}
            role="button"
            tabIndex={0}
          >
            {/* 그림자는 SVG 필터 대신 같은 모양을 1px 아래에 옅게 깐다. 필터는 기기에 따라 확대 시 작은 꼬리를 지우고,
                핀치하는 동안 매 프레임 다시 그려져 무겁다. */}
            <path className="fill-black/10" d={path} transform={`translate(0 ${viewport.unitsPerPixel})`} />
            <path
              className="fill-surface stroke-transparent group-focus-visible/badge:stroke-primary"
              d={path}
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
            {/* PRESS_FEEDBACK의 ::after 음영과 같은 값. SVG에는 ::after가 없어 말풍선 위에 같은 모양을 겹친다. */}
            <path
              className={cn(
                "fill-black opacity-0 transition-opacity duration-[350ms] dark:fill-white",
                pressedBadge === code && "opacity-[0.06] duration-0",
              )}
              d={path}
            />
            {/* dominant-baseline은 tspan에 상속되지 않는 브라우저가 있어 숫자만 내려앉는다.
                기본 기준선에 두고 글자 전체를 0.35em 내려 지역명과 숫자를 한 줄에서 가운데 맞춘다. */}
            <text
              className="fill-foreground font-bold"
              dy="0.35em"
              fontSize={BADGE_FONT_SIZE * viewport.unitsPerPixel}
              textAnchor="middle"
              x={left + width / 2}
              y={top + height / 2}
            >
              {`${label} `}
              <tspan className="fill-primary">{count}</tspan>
            </text>
          </g>
        ))}
      </svg>
      <MapControls viewport={viewport} currentLocation={currentLocation} />
      <RegionRecordsBottomSheet
        onOpenChange={setBottomSheetOpen}
        open={bottomSheetOpen}
        records={records}
        region={selectedRegion}
      />
    </>
  );
}
