"use client";

import {
  type CSSProperties,
  memo,
  type ReactNode,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ArrowsInSimpleIcon,
  CaretRightIcon,
  HouseIcon,
  ListBulletsIcon,
  MapTrifoldIcon,
  PlayIcon,
} from "@phosphor-icons/react";
import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";

import { recordLocationsQueryOptions, toRegionLocations } from "@/entities/record";
import { createRegionActivityMaps } from "@/entities/region";
import { HomeAddressSheet } from "@/features/home-address/ui/home-address-sheet";
import { getPageNavigation } from "@/shared/lib/navigation/page-navigation";
import { BottomSheet, FULL_SHEET_HEIGHT } from "@/shared/ui/bottom-sheet";
import { Button } from "@/shared/ui/button";
import { FixedToolbar } from "@/shared/ui/layouts";
import { PageBackButton } from "@/shared/ui/layouts/page-back-button";
import { LiquidGlassButton } from "@/shared/ui/liquid-glass-button";
import { ListRow, ListRowTexts } from "@/shared/ui/list-row";
import { PressLink } from "@/shared/ui/press-link";
import { RecordDetailBottomSheet } from "@/widgets/record-detail";
import { RegionRecordList } from "@/widgets/region-activity-map/ui/region-record-list";

import { durationParts } from "../model/duration";
import boundaries from "../model/map-boundaries.json";
import { enqueueJourneyPlace, skipJourneyPlace } from "../model/queue";
import { type JourneyPlace, type JourneyRecord, toJourneyRecord } from "../model/record";
import { JourneyActions } from "./journey-actions";
import styles from "./journey-map.module.css";

type Point = { latitude: number; longitude: number };
type Place = JourneyPlace;
type Region = Point & { code: string; name: string; count: number };
type RecordItem = JourneyRecord;

type Route = { points: [number, number][]; distance: number; duration: number; straight?: boolean };

type Segment = { route: Route; target: Place | null; from: Point | null; to: Point; key: number };
type Session = {
  record: RecordItem;
  region: Region;
  segments: Segment[];
  queue: Place[];
  active: Place | null;

  status: "loading" | "moving" | "drawing" | "idle" | "error";
  error: string;
  current: Place | null;

  replaying: boolean;
};
type Box = { x: number; y: number; width: number; height: number };

const NODE_HIT_RADIUS = 22;
const project = (longitude: number, latitude: number) => ({
  x: 110 + (longitude - 125.5) * 49 * Math.cos((36 * Math.PI) / 180),
  y: 23 + (39.4 - latitude) * 49,
});
const homeTopLeft = project(125.5, 39.4),
  homeBottomRight = project(130.2, 32.4);
const national: Box = {
  x: homeTopLeft.x,
  y: homeTopLeft.y,
  width: homeBottomRight.x - homeTopLeft.x,
  height: homeBottomRight.y - homeTopLeft.y,
};
const dokdo = [
  { longitude: 131.8697, latitude: 37.2411 },
  { longitude: 131.8636, latitude: 37.2425 },
].map(({ longitude, latitude }) => project(longitude, latitude));
const routeBounds = (routes: Route[]) => {
  let x = Infinity,
    y = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const route of routes)
    for (const [longitude, latitude] of route.points) {
      const point = project(longitude, latitude);
      x = Math.min(x, point.x);
      y = Math.min(y, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }
  return Number.isFinite(x) ? { x, y, maxX, maxY } : null;
};
const routeBox = (routes: Route[]): Box => {
  const bounds = routeBounds(routes);
  if (!bounds) return national;
  const { x, y, maxX, maxY } = bounds;
  const width = Math.max(0.5, maxX - x),
    height = Math.max(0.75, maxY - y);
  const paddedWidth = Math.max(width * 1.8, height * 0.75, 0.9),
    paddedHeight = Math.max(height * 1.8, width * 1.2, 1.4);
  return {
    x: x + width / 2 - paddedWidth / 2,
    y: y + height / 2 - paddedHeight * 0.45,
    width: paddedWidth,
    height: paddedHeight,
  };
};

const followBox = (view: Box, route: Route): Box | null => {
  const bounds = routeBounds([route]);
  if (!bounds) return null;
  const fit = routeBox([route]);
  const left = view.x + view.width * 0.1,
    top = view.y + view.height * 0.2;
  const visible =
    bounds.x >= left &&
    bounds.maxX <= left + view.width * 0.8 &&
    bounds.y >= top &&
    bounds.maxY <= top + view.height * 0.5;
  return visible && fit.width >= view.width * 0.3 ? null : fit;
};
const legParams = (record: RecordItem, region: Region, target: Place | null, from: Place | null) => {
  const params = new URLSearchParams({ recordId: record.id, region: region.code });
  if (target) {
    params.set("placeId", target.id);
    if (from) params.set("fromPlaceId", from.id);
  }
  return params;
};
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const scrollEdges = (row: HTMLElement) => ({
  start: row.scrollLeft > 1,
  end: row.scrollLeft + row.clientWidth < row.scrollWidth - 1,
});
const keepIfSame = (next: { start: boolean; end: boolean }) => (current: { start: boolean; end: boolean }) =>
  current.start === next.start && current.end === next.end ? current : next;
const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const MIN_VIEW_WIDTH = 0.5;

const CAMERA_SETTLE_MS = 350;

const SHEET_CLOSE_FALLBACK_MS = 700;
const fetchRoute = async (params: URLSearchParams, signal: AbortSignal) => {
  const response = await fetch(`/journey/directions?${params}`, { signal, cache: "no-store" });
  const body = (await response.json()) as { route?: Route; error?: string };
  if (!response.ok || !body.route) throw new Error(body.error ?? "경로를 불러오지 못했어요.");
  return body.route;
};

const routeLabels = (
  startPoint: { x: number; y: number } | null,
  session: Session | null,
  segments: Segment[],
  unit: number,
) => {
  if (!session || !startPoint) return [];
  const labels = new Map([["home", { ...startPoint, name: "내 집" }]]);
  for (const segment of segments) {
    if (!segment.target) continue;
    const name = segment.target.name;
    labels.set(`${name}:${segment.to.longitude},${segment.to.latitude}`, {
      ...project(segment.to.longitude, segment.to.latitude),
      name,
    });
  }
  const placed: { x: number; y: number; shift: number }[] = [];
  return [...labels].map(([key, label]) => {
    let shift = 0;
    for (const other of placed)
      if (Math.abs(label.x - other.x) < unit * 70 && Math.abs(label.y - other.y) < unit * 20)
        shift = Math.max(shift, other.shift + 14);
    placed.push({ ...label, shift });
    return { key, ...label, shift };
  });
};

const MapShapes = memo(function MapShapes() {
  return (
    <g className={styles.land}>
      {boundaries.regions.map((item) => (
        <path key={item.code} d={item.path} />
      ))}
      {dokdo.map((point) => (
        <circle key={point.x} cx={point.x} cy={point.y} r={0.45} />
      ))}
      <path d={boundaries.coast} />
    </g>
  );
});
const DistrictShapes = memo(function DistrictShapes() {
  return (
    <>
      {boundaries.districts.map((path) => (
        <path key={path} d={path} />
      ))}
    </>
  );
});
function SegmentPath({ segment, drawing, unit }: { segment: Segment; drawing: boolean; unit: number }) {
  const path = useMemo(
    () =>
      [
        ...(segment.from ? [segment.from] : []),
        ...segment.route.points.map(([longitude, latitude]) => ({ longitude, latitude })),
        segment.to,
      ]
        .map(({ longitude, latitude }, index) => {
          const point = project(longitude, latitude);
          return `${index ? "L" : "M"}${point.x},${point.y}`;
        })
        .join(""),
    [segment],
  );
  return (
    <path
      className={`${styles.route} ${drawing ? styles.drawing : ""}`}
      d={path}
      pathLength={1}
      strokeWidth={unit * 2.5}
    />
  );
}

function AnimatedNumber({ value, format }: { value: number; format: (value: number) => ReactNode }) {
  const [display, setDisplay] = useState(0);
  const previous = useRef(0);

  useEffect(() => {
    const start = previous.current;
    const started = performance.now();
    if (prefersReducedMotion()) {
      setDisplay(value);
      previous.current = value;
      return;
    }
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / 900);
      const current = start + (value - start) * t;
      previous.current = current;
      setDisplay(current);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{format(display)}</>;
}

export function JourneyMap({
  regions,
  hasHome,
  homeUnavailable,
  member,
}: {
  regions: Region[];
  hasHome: boolean;
  homeUnavailable: boolean;
  member: { id: string; name: string };
}) {
  const [region, setRegion] = useState<Region | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const generation = useRef(0);
  const queryClient = useQueryClient();
  const router = useRouter();

  const routeQuery = (params: URLSearchParams) =>
    queryOptions({
      queryKey: ["journey-route", member.id, params.toString()],
      queryFn: ({ signal }) => fetchRoute(params, signal),
      staleTime: Number.POSITIVE_INFINITY,
      gcTime: Number.POSITIVE_INFINITY,
      retry: false,
    });
  const [sheet, setSheet] = useState<"regions" | "choices" | "records" | null>(null);
  const [choices, setChoices] = useState<Region[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [chipRow, setChipRow] = useState<HTMLDivElement | null>(null);
  const [chipFade, setChipFade] = useState({ start: false, end: false });

  useEffect(() => {
    if (!chipRow) return;
    const update = () => setChipFade(keepIfSame(scrollEdges(chipRow)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(chipRow);
    return () => observer.disconnect();
  }, [chipRow]);
  const main = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (main.current && getPageNavigation(window).traversal) main.current.style.animation = "none";
  }, []);

  const searchParams = useSearchParams();

  const [initialUrl] = useState(() => ({
    region: searchParams?.get("region") ?? null,
    record: searchParams?.get("record") ?? null,
    places: searchParams?.get("places")?.split(",") ?? [],
  }));

  const [addressOpen, setAddressOpen] = useState(false);
  const [homeSaved, setHomeSaved] = useState(false);
  const homeReady = (hasHome || homeSaved) && !homeUnavailable;
  const sheetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sheetClosed = useRef<Promise<unknown>>(Promise.resolve());
  const resolveSheetClosed = useRef<(() => void) | null>(null);
  const [sheetHeader, setSheetHeader] = useState<HTMLDivElement | null>(null);
  const [sheetBody, setSheetBody] = useState<HTMLDivElement | null>(null);
  const compactHeightRef = useRef(360);
  const [compactHeight, setCompactHeight] = useState(360);
  const [snapPoint, setSnapPoint] = useState<number | string | null>(360);

  const showSheet = (next: typeof sheet) => {
    if (sheetTimer.current) clearTimeout(sheetTimer.current);
    sheetTimer.current = null;
    setSheet(next);
    setSnapPoint(next === "records" ? 1 : compactHeightRef.current);
  };

  useLayoutEffect(() => {
    if ((sheet !== "regions" && sheet !== "choices") || !sheetHeader || !sheetBody) return;
    const measure = () => {
      const height = Math.ceil(sheetHeader.offsetHeight + sheetBody.offsetHeight + 29);
      if (height === compactHeightRef.current) return;
      const previous = compactHeightRef.current;
      compactHeightRef.current = height;
      setCompactHeight(height);
      setSnapPoint((current) => (current === previous ? height : current));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(sheetHeader);
    observer.observe(sheetBody);
    return () => observer.disconnect();
  }, [sheet, sheetHeader, sheetBody]);

  const [box, setBox] = useState<Box>(national);
  const boxRef = useRef(box);
  const cameraAnimation = useRef(0);
  const svg = useRef<SVGSVGElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const [dimensions, setDimensions] = useState({ width: 390, height: 844 });
  const setSessionValue = (next: Session | null) => {
    sessionRef.current = next;
    setSession(next);
  };
  const setView = (next: Box) => {
    boxRef.current = next;
    setBox(next);
  };
  const moveCamera = (next: Box) => {
    cancelAnimationFrame(cameraAnimation.current);
    const start = boxRef.current,
      started = performance.now();
    if (prefersReducedMotion()) {
      setView(next);
      return;
    }
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / 650),
        e = 1 - (1 - t) ** 3;
      setView({
        x: start.x + (next.x - start.x) * e,
        y: start.y + (next.y - start.y) * e,
        width: start.width + (next.width - start.width) * e,
        height: start.height + (next.height - start.height) * e,
      });
      if (t < 1) cameraAnimation.current = requestAnimationFrame(tick);
    };
    cameraAnimation.current = requestAnimationFrame(tick);
  };

  const zoomAt = (clientX: number, clientY: number, factor: number, panX = 0, panY = 0) => {
    const rect = svg.current?.getBoundingClientRect();
    if (!rect) return;
    const b = boxRef.current;
    const scale = Math.max(b.width / rect.width, b.height / rect.height);
    const anchorX = b.x + b.width / 2 + (clientX - rect.left - rect.width / 2) * scale;
    const anchorY = b.y + b.height / 2 + (clientY - rect.top - rect.height / 2) * scale;
    const f = Math.max(MIN_VIEW_WIDTH, Math.min(400, b.width * factor)) / b.width;
    setView({
      x: anchorX + (b.x - anchorX) * f - panX * scale * f,
      y: anchorY + (b.y - anchorY) * f - panY * scale * f,
      width: b.width * f,
      height: b.height * f,
    });
  };
  const releasePointer = (event: React.PointerEvent) => {
    pointers.current.delete(event.pointerId);
  };
  useEffect(() => {
    const element = svg.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setDimensions({ width: entry.contentRect.width, height: entry.contentRect.height }),
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(cameraAnimation.current);
      if (sheetTimer.current) clearTimeout(sheetTimer.current);
      generation.current++;
    };
  }, []);
  useEffect(() => () => queryClient.removeQueries({ queryKey: ["journey-route"] }), [queryClient]);
  const locations = useQuery(recordLocationsQueryOptions);
  const [subregion, setSubregion] = useState<string | null>(null);
  const regionMaps = useMemo(
    () => (locations.data ? createRegionActivityMaps(toRegionLocations(locations.data)) : []),
    [locations.data],
  );
  const journeyRecord = (recordId: string) => {
    const record = locations.data?.find((item) => item.id === recordId);
    return record && region ? toJourneyRecord(record, region.code) : null;
  };
  const run = async (initial: Session, token: number) => {
    let next = initial;
    while (token === generation.current) {
      const target = next.active;
      try {
        const route = await queryClient.fetchQuery(
          routeQuery(legParams(next.record, next.region, target, next.current)),
        );
        if (token !== generation.current) return;
        const camera = target ? followBox(boxRef.current, route) : routeBox([route]);
        if (camera) moveCamera(camera);
        setSessionValue({ ...sessionRef.current!, status: "moving" });
        await Promise.all([sheetClosed.current, camera && !prefersReducedMotion() ? sleep(CAMERA_SETTLE_MS) : null]);
        if (token !== generation.current) return;
        const segment = {
          route,
          target,
          from: target ? (next.current ?? next.record.destination) : null,
          to: target ?? next.record.destination,
          key: Date.now() + Math.random(),
        };
        next = { ...sessionRef.current!, segments: [...sessionRef.current!.segments, segment], status: "drawing" };
        setSessionValue(next);
        await sleep(prefersReducedMotion() ? 0 : 900);
        if (token !== generation.current) return;
        next = { ...sessionRef.current!, current: target, active: null, status: "idle" };
        setSessionValue(next);
        if (!next.queue.length) {
          if (next.replaying) setSessionValue({ ...next, replaying: false });
          return;
        }
        const [first, ...rest] = next.queue;
        next = { ...next, active: first, queue: rest, status: "loading" };
        setSessionValue(next);
      } catch (error) {
        if (token !== generation.current) return;
        next = {
          ...sessionRef.current!,
          status: "error",
          error: error instanceof Error ? error.message : "경로를 불러오지 못했어요.",
          replaying: false,
        };
        setSessionValue(next);
        return;
      }
    }
  };
  const begin = (record: RecordItem, selectedRegion: Region, replay?: Place[]) => {
    const token = ++generation.current;
    sheetClosed.current =
      sheet === null
        ? Promise.resolve()
        : Promise.race([
            new Promise<void>((resolve) => {
              resolveSheetClosed.current = resolve;
            }),
            sleep(SHEET_CLOSE_FALLBACK_MS),
          ]);
    const next: Session = {
      record,
      region: selectedRegion,
      segments: [],
      queue: replay ?? [],
      active: null,
      status: "loading",
      error: "",
      current: null,
      replaying: Boolean(replay),
    };
    setSessionValue(next);
    setHighlight(null);
    showSheet(null);
    void run(next, token);
  };
  const [highlight, setHighlight] = useState<{ place: Place; key: number } | null>(null);
  const focusPlace = (place: Place) => {
    const p = project(place.longitude, place.latitude);
    const b = boxRef.current;
    moveCamera({ ...b, x: p.x - b.width / 2, y: p.y - b.height * 0.45 });
    setHighlight({ place, key: Date.now() });
  };
  const selectPlace = (place: Place) => {
    const current = sessionRef.current;
    if (!current) return;
    if (completeSegments.some((segment) => segment.target?.id === place.id)) {
      focusPlace(place);
      return;
    }
    const next = enqueueJourneyPlace(current, place);
    if (next === current) return;
    setSessionValue(next);
    if (current.status === "idle") void run(next, generation.current);
  };
  const recover = (skip: boolean) => {
    const current = sessionRef.current;
    if (!current || current.status !== "error") return;
    if (!skip) {
      const next = { ...current, status: "loading" as const, error: "" };
      setSessionValue(next);
      void run(next, generation.current);
      return;
    }
    const next = { ...skipJourneyPlace(current), error: "" };
    setSessionValue(next);
    if (next.status === "loading") void run(next, generation.current);
  };
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    for (const key of ["region", "record", "places"]) params.delete(key);
    if (session) {
      params.set("region", session.region.code);
      params.set("record", session.record.id);
      const places = session.segments.flatMap((segment) => (segment.target ? [segment.target.id] : []));
      if (places.length) params.set("places", places.join(","));
    }
    const query = params.toString();
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
  }, [session]);
  const restoreJourney = useEffectEvent((rows: NonNullable<typeof locations.data>) => {
    const target = regions.find((item) => item.code === initialUrl.region);
    const row = rows.find((item) => item.id === initialUrl.record);
    const record = target && row && homeReady ? toJourneyRecord(row, target.code) : null;
    if (!target || !record) return;
    setRegion(target);
    begin(
      record,
      target,
      initialUrl.places.flatMap((id) => record.places.filter((place) => place.id === id)),
    );
  });
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current || !locations.data || locations.isFetching) return;
    restored.current = true;
    restoreJourney(locations.data);
  }, [locations.data, locations.isFetching]);

  const pressPlace = (place: Place) => {
    const current = sessionRef.current;
    if (current?.status !== "idle" || current.segments.some((segment) => segment.target?.id === place.id)) return;
    void queryClient.prefetchQuery(routeQuery(legParams(current.record, current.region, place, current.current)));
  };
  const reset = () => {
    generation.current++;
    setSessionValue(null);
    setHighlight(null);
    setRegion(null);
    showSheet(null);
    moveCamera(national);
  };

  const toMapPoint = (clientX: number, clientY: number) => {
    const rect = svg.current?.getBoundingClientRect();
    if (!rect) return null;
    const b = boxRef.current;
    const scale = Math.max(b.width / rect.width, b.height / rect.height);
    return {
      x: b.x + b.width / 2 + (clientX - rect.left - rect.width / 2) * scale,
      y: b.y + b.height / 2 + (clientY - rect.top - rect.height / 2) * scale,
    };
  };

  const chooseRegion = (selected: Region, tap?: { clientX: number; clientY: number }) => {
    const point = tap && toMapPoint(tap.clientX, tap.clientY);
    const nearby = point
      ? regions.filter((item) => {
          const p = project(item.longitude, item.latitude);
          return Math.hypot(p.x - point.x, p.y - point.y) <= unit * NODE_HIT_RADIUS;
        })
      : [];
    if (nearby.length > 1) {
      setChoices(nearby);
      showSheet("choices");
      return;
    }
    openRegion(selected);
  };
  const openRegion = (selected: Region) => {
    if (selected.code !== region?.code) setSubregion(null);
    const rising = sheet === "regions" || sheet === "choices";
    if (!rising || prefersReducedMotion()) {
      setRegion(selected);
      showSheet("records");
      return;
    }
    setSnapPoint(1);
    if (sheetTimer.current) clearTimeout(sheetTimer.current);
    sheetTimer.current = setTimeout(() => {
      sheetTimer.current = null;
      setRegion(selected);
      setSheet("records");
    }, 250);
  };
  const unit = Math.max(box.width / dimensions.width, box.height / dimensions.height);
  const nodeLabelOpacity = Math.max(0, Math.min(1, (150 - box.width) / 40));
  const completeSegments = session?.status === "drawing" ? session.segments.slice(0, -1) : (session?.segments ?? []);
  const selectedPlaceIds = new Set([
    ...(session?.segments.flatMap((segment) => (segment.target ? [segment.target.id] : [])) ?? []),
    ...(session?.active ? [session.active.id] : []),
    ...(session?.queue.map((place) => place.id) ?? []),
  ]);
  const start = session?.segments[0]?.route.points[0];
  const startPoint = start ? project(start[0], start[1]) : null;
  const segments = session?.segments ?? [];
  const distance = segments.reduce((sum, segment) => sum + segment.route.distance, 0);
  const duration = segments.reduce((sum, segment) => sum + segment.route.duration, 0);
  return (
    <main ref={main} className={`${styles.page} dark`} data-direction="forward" data-funnel-step>
      <svg
        ref={svg}
        className={styles.map}
        viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`}
        aria-label="방문 지역 지도"
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          cancelAnimationFrame(cameraAnimation.current);
          pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const tracked = pointers.current;
          if (!tracked.has(event.pointerId)) return;
          const [a, b] = [...tracked.values()];
          tracked.set(event.pointerId, { x: event.clientX, y: event.clientY });
          const [nextA, nextB] = [...tracked.values()];
          if (!b) {
            zoomAt(0, 0, 1, nextA.x - a.x, nextA.y - a.y);
            return;
          }
          const distance = Math.hypot(nextB.x - nextA.x, nextB.y - nextA.y);
          if (!distance || tracked.size > 2) return;
          const midX = (a.x + b.x) / 2,
            midY = (a.y + b.y) / 2;
          zoomAt(
            midX,
            midY,
            Math.hypot(b.x - a.x, b.y - a.y) / distance,
            (nextA.x + nextB.x) / 2 - midX,
            (nextA.y + nextB.y) / 2 - midY,
          );
        }}
        onPointerUp={releasePointer}
        onPointerCancel={releasePointer}
        onWheel={(event) => {
          cancelAnimationFrame(cameraAnimation.current);
          zoomAt(event.clientX, event.clientY, Math.exp(event.deltaY * 0.001));
        }}
      >
        <MapShapes />
        <g className={styles.districts} opacity={Math.max(0, Math.min(0.65, (120 - box.width) / 80))}>
          <DistrictShapes />
        </g>
        {session?.segments.map((segment, index) => (
          <SegmentPath
            key={segment.key}
            segment={segment}
            unit={unit}
            drawing={session.status === "drawing" && index === session.segments.length - 1}
          />
        ))}
        {!session &&
          regions.map((item) => {
            const p = project(item.longitude, item.latitude);
            return (
              <g
                key={item.code}
                role="button"
                tabIndex={0}
                aria-label={`${item.name} 기록 ${item.count}개`}
                className={styles.node}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => chooseRegion(item, event)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    chooseRegion(item);
                  }
                }}
              >
                <circle cx={p.x} cy={p.y} r={unit * NODE_HIT_RADIUS} fill="transparent" />
                <circle cx={p.x} cy={p.y} r={unit * 7} className={styles.halo} />
                <circle cx={p.x} cy={p.y} r={unit * 3.5} className={styles.previous} />
                {nodeLabelOpacity > 0 && (
                  <text
                    aria-hidden="true"
                    className={styles.label}
                    fontSize={unit * 11}
                    opacity={nodeLabelOpacity}
                    strokeWidth={unit * 3}
                    x={p.x + unit * 10}
                    y={p.y + unit * 4}
                  >
                    {item.name}
                  </text>
                )}
              </g>
            );
          })}
        {startPoint && <circle cx={startPoint.x} cy={startPoint.y} r={unit * 4.5} className={styles.visited} />}
        {session &&
          completeSegments.map((segment, index) => {
            const p = project(segment.to.longitude, segment.to.latitude);
            const isCurrent = index === completeSegments.length - 1 && session.status !== "drawing";
            return (
              <g key={`point-${segment.key}`}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={unit * (isCurrent ? 3.5 : 4.5)}
                  className={isCurrent ? styles.arrival : styles.visited}
                />
                {isCurrent && <circle cx={p.x} cy={p.y} r={unit * 9} strokeWidth={unit} className={styles.pulse} />}
              </g>
            );
          })}
        {session && highlight && (
          <circle
            key={highlight.key}
            className={styles.focusRing}
            cx={project(highlight.place.longitude, highlight.place.latitude).x}
            cy={project(highlight.place.longitude, highlight.place.latitude).y}
            r={unit * 9}
            strokeWidth={unit * 1.5}
          />
        )}
        {routeLabels(startPoint, session, completeSegments, unit).map((label) =>
          label.key === "home" ? (
            <HouseIcon
              key={label.key}
              aria-label="내 집"
              className={styles.homeIcon}
              size={unit * 14}
              weight="fill"
              x={label.x - unit * 7}
              y={label.y - unit * (20 + label.shift)}
            />
          ) : (
            <text
              key={label.key}
              className={styles.label}
              x={label.x + unit * 7}
              y={label.y - unit * (7 + label.shift)}
              fontSize={unit * 11}
              strokeWidth={unit * 3}
            >
              {label.name}
            </text>
          ),
        )}
      </svg>
      <PageBackButton fallbackHref="/" />
      <FixedToolbar className="justify-end">
        {session ? (
          <JourneyActions
            hidden={session.replaying}
            actions={[
              {
                label: "전체 경로 보기",
                icon: ArrowsInSimpleIcon,
                onSelect: () => moveCamera(routeBox(session.segments.map((segment) => segment.route))),
              },
              {
                label: "다시 보기",
                icon: PlayIcon,
                onSelect: () =>
                  begin(session.record, session.region, [
                    ...session.segments.flatMap((segment) => (segment.target ? [segment.target] : [])),
                    ...(session.active ? [session.active] : []),
                    ...session.queue,
                  ]),
              },
              {
                label: "이 지역 기록 목록",
                icon: ListBulletsIcon,
                onSelect: () => {
                  setRegion(session.region);
                  showSheet("records");
                },
              },
              { label: "전국 지도로 돌아가기", icon: MapTrifoldIcon, onSelect: reset },
            ]}
          />
        ) : (
          <div className={styles.actions}>
            <LiquidGlassButton className="min-w-0 px-5 text-foreground text-sm" onClick={() => showSheet("regions")}>
              지역 목록
            </LiquidGlassButton>
          </div>
        )}
      </FixedToolbar>
      {session && (
        <div className={styles.recordHeader}>
          <h1>{session.region.name}의 기억</h1>
          <div className={styles.tools} data-hidden={session.replaying ? "" : undefined} inert={session.replaying}>
            <Button
              className={styles.hit}
              color="dark"
              onClick={() => setDetailOpen(true)}
              size="medium"
              variant="weak"
            >
              기록 읽기
            </Button>
          </div>
        </div>
      )}
      {!session && !regions.length && (
        <div className={styles.empty}>
          <p>아직 방문 지역이 있는 기록이 없어요.</p>
          <Button nativeButton={false} render={<PressLink href="/records/new" />} size="large">
            기록 남기기
          </Button>
        </div>
      )}
      {session && (
        <div className={styles.details}>
          <p className={styles.placesHeading}>
            방문 장소 {session.record.places.length > 0 && <span>{session.record.places.length}</span>}
          </p>
          {!session.record.places.length && <p className={styles.placesEmpty}>등록된 장소가 없어요</p>}
          <div
            key={session.record.id}
            ref={setChipRow}
            className={styles.chips}
            data-fade-end={chipFade.end ? "" : undefined}
            data-fade-start={chipFade.start ? "" : undefined}
            onScroll={(event) => setChipFade(keepIfSame(scrollEdges(event.currentTarget)))}
          >
            {session.record.places.map((place) => (
              <button
                key={place.id}
                type="button"
                onClick={() => selectPlace(place)}
                onPointerDown={(event) => {
                  if (event.button === 0) pressPlace(place);
                }}
                data-selected={selectedPlaceIds.has(place.id) ? "" : undefined}
              >
                {place.name}
                {selectedPlaceIds.has(place.id) && <span className="sr-only"> (선택됨)</span>}
              </button>
            ))}
          </div>
          <div className={styles.metrics}>
            <strong>
              {segments.length ? <AnimatedNumber value={distance / 1000} format={(value) => value.toFixed(1)} /> : "—"}
              <small> km</small>
            </strong>
            <em>
              {segments.length ? (
                <AnimatedNumber
                  value={duration / 60}
                  format={(value) =>
                    durationParts(Math.round(value)).map(([amount, unit]) => (
                      <span key={unit}>
                        <b>{amount}</b>
                        {unit}
                      </span>
                    ))
                  }
                />
              ) : (
                <>
                  <b>—</b>분
                </>
              )}
            </em>
          </div>
          {segments.some((segment) => segment.route.straight) && (
            <p className={styles.note}>차로 갈 수 없는 구간은 직선으로 이었고 거리·시간에서 뺐어요</p>
          )}

          {session.status === "loading" && (
            <p className={styles.status} role="status">
              경로를 불러오고 있어요
            </p>
          )}
          {session.status === "error" && (
            <div role="alert" className={styles.error}>
              <span>{session.error}</span>
              <Button className={styles.hit} color="dark" onClick={() => recover(false)} size="medium" variant="weak">
                다시 시도
              </Button>
              {session.active && (
                <Button className={styles.hit} color="dark" onClick={() => recover(true)} size="medium" variant="weak">
                  건너뛰기
                </Button>
              )}
            </div>
          )}
        </div>
      )}
      {!session && !homeReady && (
        <div className={styles.homeNotice}>
          {homeUnavailable ? (
            "집 주소를 불러오지 못했어요."
          ) : (
            <>
              <p>길을 따라가려면 집 주소를 등록해 주세요.</p>
              <Button
                className={styles.hit}
                color="dark"
                onClick={() => setAddressOpen(true)}
                size="medium"
                variant="weak"
              >
                등록하기
              </Button>
            </>
          )}
        </div>
      )}
      <BottomSheet
        snapPoints={[compactHeight, 1]}
        snapPoint={snapPoint}
        onSnapPointChange={setSnapPoint}
        open={sheet !== null}
        onOpenChangeComplete={(open) => {
          if (open) return;
          resolveSheetClosed.current?.();
          resolveSheetClosed.current = null;
        }}
        onOpenChange={(open) => {
          if (open) return;
          showSheet(null);
          if (!sessionRef.current) setRegion(null);
        }}
        showSwipeHandle
      >
        <BottomSheet.Content
          className="dark motion-safe:duration-250 motion-safe:ease-[cubic-bezier(0.32,0.72,0,1)]"
          style={{ "--drawer-content-max-height": `min(700px, ${FULL_SHEET_HEIGHT})` } as CSSProperties}
        >
          {sheet === "records" && homeReady && locations.data && region ? (
            <RegionRecordList
              isDetail={false}
              onRecordOpen={(recordId) => {
                const record = journeyRecord(recordId);
                if (record) begin(record, region);
              }}
              onRecordPress={(recordId) => {
                const record = journeyRecord(recordId);
                if (record) void queryClient.prefetchQuery(routeQuery(legParams(record, region, null, null)));
              }}
              onSubregionChange={setSubregion}
              records={locations.data}
              region={regionMaps.find(({ code }) => code === region.code) ?? null}
              subregion={subregion}
            />
          ) : (
            <>
              <BottomSheet.Header ref={setSheetHeader}>
                <BottomSheet.Title>
                  {sheet === "regions"
                    ? "방문한 지역"
                    : sheet === "choices"
                      ? "어느 지역의 기록을 볼까요?"
                      : `${region?.name ?? ""}의 기억`}
                </BottomSheet.Title>
                {sheet !== "records" && (
                  <BottomSheet.Description>다시 보고 싶은 지역을 선택해 주세요.</BottomSheet.Description>
                )}
              </BottomSheet.Header>
              <div ref={setSheetBody} className="min-h-0 overflow-y-auto px-5 pt-4 pb-8">
                {(sheet === "regions" || sheet === "choices") &&
                  (sheet === "choices" ? choices : regions).map((item) => (
                    <ListRow
                      key={item.code}
                      className="px-1"
                      onClick={() => openRegion(item)}
                      right={<CaretRightIcon aria-hidden="true" size={20} />}
                    >
                      <ListRowTexts description={`기록 ${item.count}개`} title={item.name} />
                    </ListRow>
                  ))}
                {sheet === "records" && !homeReady && (
                  <div className={styles.sheetNotice}>
                    <p>
                      {homeUnavailable
                        ? "집 주소를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."
                        : "기록까지 이어지는 길은 내 집에서 출발해요. 집 주소를 먼저 등록해 주세요."}
                    </p>
                    {!homeUnavailable && (
                      <Button
                        onClick={() => {
                          showSheet(null);
                          setAddressOpen(true);
                        }}
                        size="large"
                      >
                        집 주소 등록하기
                      </Button>
                    )}
                  </div>
                )}
                {sheet === "records" && homeReady && locations.isPending && (
                  <div className={styles.skeleton} aria-label="기록을 불러오는 중">
                    <i />
                    <i />
                    <i />
                  </div>
                )}
                {sheet === "records" && homeReady && locations.isError && (
                  <p>
                    기록을 불러오지 못했어요.{" "}
                    <button type="button" onClick={() => void locations.refetch()}>
                      다시 시도
                    </button>
                  </p>
                )}
              </div>
            </>
          )}
        </BottomSheet.Content>
      </BottomSheet>
      <HomeAddressSheet
        address={null}
        dark
        memberName={member.name}
        onOpenChange={setAddressOpen}
        onSaved={() => {
          setHomeSaved(true);
          if (region) showSheet("records");
        }}
        open={addressOpen}
      />
      <RecordDetailBottomSheet
        backLabel="지도로"
        className="dark"
        member={member}
        onDeleted={() => {
          setDetailOpen(false);
          reset();
          router.refresh();
        }}
        onOpenChange={setDetailOpen}
        open={detailOpen}
        record={session?.record ?? null}
      />
    </main>
  );
}
