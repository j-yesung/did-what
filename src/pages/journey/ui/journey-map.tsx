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
  WarningCircleIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";

import { recordLocationsQueryOptions, toRegionLocations } from "@/entities/record";
import { createRegionActivityMaps } from "@/entities/region";
import { HomeAddressSheet } from "@/features/home-address/ui/home-address-sheet";
import { FOCUS_RING, PRESS_FEEDBACK } from "@/shared/lib/interaction";
import { getPageNavigation } from "@/shared/lib/navigation/page-navigation";
import { cn } from "@/shared/lib/utils";
import { BottomSheet, FULL_SHEET_HEIGHT } from "@/shared/ui/bottom-sheet";
import { Button } from "@/shared/ui/button";
import { IconButton } from "@/shared/ui/icon-button";
import { FixedToolbar } from "@/shared/ui/layouts";
import { PageBackButton } from "@/shared/ui/layouts/page-back-button";
import { LiquidGlassButton } from "@/shared/ui/liquid-glass-button";
import { ListRow, ListRowTexts } from "@/shared/ui/list-row";
import { LoadErrorAlert } from "@/shared/ui/load-error-alert";
import { PressLink } from "@/shared/ui/press-link";
import { SHEET_EXPAND_MS, useCompactSnapPoint } from "@/shared/ui/use-compact-snap-point";
import { RecordDetailBottomSheet } from "@/widgets/record-detail";
import { RegionRecordList } from "@/widgets/region-activity-map/ui/region-record-list";

import { JourneyRouteError, journeyRouteQuery } from "../api/route-query";
import { durationParts } from "../model/duration";
import boundaries from "../model/map-boundaries.json";
import {
  type Box,
  constrainView,
  followBox,
  momentumView,
  national,
  placeLabels,
  placesBox,
  project,
  routeBox,
} from "../model/map-view";
import { enqueueJourneyPlace, pickedJourneyPlaces, skipJourneyPlace } from "../model/queue";
import { type JourneyRecord, toJourneyRecord } from "../model/record";
import {
  type JourneyStatus,
  type JourneyPlace as Place,
  type JourneyPoint as Point,
  type JourneyRegion as Region,
  type JourneyRoute as Route,
  SKETCH_MS,
} from "../model/types";
import { JourneyActions } from "./journey-actions";
import styles from "./journey-map.module.css";

type RecordItem = JourneyRecord;

type Segment = { route: Route; target: Place | null; from: Point | null; to: Point; key: number };
type Session = {
  record: RecordItem;
  region: Region;
  segments: Segment[];
  queue: Place[];
  active: Place | null;

  status: JourneyStatus;
  error: string;
  errorCode?: string;
  current: Place | null;

  replaying: boolean;
  restored?: boolean;
};

const NODE_HIT_RADIUS = 22;
const dokdo = [
  { longitude: 131.8697, latitude: 37.2411 },
  { longitude: 131.8636, latitude: 37.2425 },
].map(({ longitude, latitude }) => project(longitude, latitude));
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const scrollEdges = (row: HTMLElement) => ({
  start: row.scrollLeft > 1,
  end: row.scrollLeft + row.clientWidth < row.scrollWidth - 1,
});
const keepIfSame = (next: { start: boolean; end: boolean }) => (current: { start: boolean; end: boolean }) =>
  current.start === next.start && current.end === next.end ? current : next;
const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const MIN_VIEW_WIDTH = 0.02;

const CAMERA_SETTLE_MS = 350;

const SHEET_CLOSE_FALLBACK_MS = 700;
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

function AnimatedNumber({
  value,
  format,
  instant = false,
}: {
  value: number;
  format: (value: number) => ReactNode;
  instant?: boolean;
}) {
  const [display, setDisplay] = useState(instant ? value : 0);
  const previous = useRef(instant ? value : 0);

  useEffect(() => {
    const start = previous.current;
    const started = performance.now();
    if (instant || prefersReducedMotion()) {
      setDisplay(value);
      previous.current = value;
      return;
    }
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / SKETCH_MS);
      const current = start + (value - start) * t;
      previous.current = current;
      setDisplay(current);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, instant]);

  return <>{format(display)}</>;
}

export function JourneyMap({
  regions,
  hasHome,
  homeVersion,
  homeUnavailable,
  member,
}: {
  regions: Region[];
  hasHome: boolean;
  homeVersion: string | null;
  homeUnavailable: boolean;
  member: { id: string; name: string };
}) {
  const [region, setRegion] = useState<Region | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const generation = useRef(0);
  const fastForward = useRef(false);
  const animationDone = useRef<(() => void) | null>(null);
  const deletedRegion = useRef<Region | null>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  const routeQuery = (record: RecordItem, region: Region, target: Place | null, from: Place | null) =>
    journeyRouteQuery(member.id, homeVersion, record, region, target, from);
  const [sheet, setSheet] = useState<"regions" | "choices" | "records" | "places" | null>(null);
  const [content, setContent] = useState(sheet);
  if (sheet !== null && sheet !== content) setContent(sheet);
  const opener = useRef<Element | null>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const regionsButton = useRef<HTMLButtonElement>(null);
  const [choices, setChoices] = useState<Region[]>([]);
  const [placeChoices, setPlaceChoices] = useState<Place[]>([]);
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

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (root.classList.contains("dark")) return;
    root.classList.add("dark");
    return () => root.classList.remove("dark");
  }, []);

  const searchParams = useSearchParams();

  const [initialUrl] = useState(() => ({
    region:
      typeof window !== "undefined" && getPageNavigation(window).traversal
        ? (searchParams?.get("region") ?? null)
        : null,
    record: searchParams?.get("record") ?? null,
    places: searchParams?.get("places")?.split(",") ?? [],
    detail: searchParams?.get("detail") === "1",
  }));
  const restoringDetail = Boolean(initialUrl.region && initialUrl.record && initialUrl.detail);
  const [detailRecordId, setDetailRecordId] = useState(restoringDetail ? initialUrl.record : null);
  const [detailOpen, setDetailOpen] = useState(restoringDetail);
  const [restoring, setRestoring] = useState(Boolean(initialUrl.region && initialUrl.record));
  const restored = useRef(false);

  const [addressOpen, setAddressOpen] = useState(false);
  const [homeSaved, setHomeSaved] = useState(false);
  const homeReady = (hasHome || homeSaved) && !homeUnavailable;
  const sheetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sheetClosed = useRef<Promise<unknown>>(Promise.resolve());
  const resolveSheetClosed = useRef<(() => void) | null>(null);
  const {
    compactHeight,
    compactHeightRef,
    snapPoint,
    setSnapPoint,
    setHeader: setSheetHeader,
    setBody: setSheetBody,
  } = useCompactSnapPoint(sheet === "regions" || sheet === "choices" || sheet === "places");

  const showSheet = (next: typeof sheet) => {
    if (next !== null && sheet === null && !addressOpen) opener.current = document.activeElement;
    if (sheetTimer.current) clearTimeout(sheetTimer.current);
    sheetTimer.current = null;
    setSheet(next);
    if (next !== null) setSnapPoint(next === "records" ? 1 : compactHeightRef.current);
  };

  const [box, setBox] = useState<Box>(national);
  const boxRef = useRef(box);
  const cameraAnimation = useRef(0);
  const svg = useRef<SVGSVGElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const dragOrigin = useRef<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);
  const dragEndAt = useRef(Number.NEGATIVE_INFINITY);
  const panSamples = useRef<{ x: number; y: number; time: number }[]>([]);
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

  const zoomAt = (clientX: number, clientY: number, factor: number, panX = 0, panY = 0, elastic = false) => {
    const rect = svg.current?.getBoundingClientRect();
    if (!rect) return;
    const b = boxRef.current;
    const scale = Math.max(b.width / rect.width, b.height / rect.height);
    const anchorX = b.x + b.width / 2 + (clientX - rect.left - rect.width / 2) * scale;
    const anchorY = b.y + b.height / 2 + (clientY - rect.top - rect.height / 2) * scale;
    const desired = b.width * factor;
    const limited = Math.max(MIN_VIEW_WIDTH, Math.min(400, desired));
    const f = (elastic ? limited + (desired - limited) * 0.15 : limited) / b.width;
    setView(
      constrainView({
        x: anchorX + (b.x - anchorX) * f - panX * scale * f,
        y: anchorY + (b.y - anchorY) * f - panY * scale * f,
        width: b.width * f,
        height: b.height * f,
      }),
    );
  };
  const releasePointer = (event: React.PointerEvent) => {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size) {
      panSamples.current = [];
      return;
    }
    const wasDragged = dragged.current;
    dragEndAt.current = wasDragged ? event.timeStamp : Number.NEGATIVE_INFINITY;
    dragged.current = false;
    const view = boxRef.current;
    if (view.width < MIN_VIEW_WIDTH || view.width > 400) {
      const width = Math.max(MIN_VIEW_WIDTH, Math.min(400, view.width));
      const height = (view.height * width) / view.width;
      moveCamera({ x: view.x + (view.width - width) / 2, y: view.y + (view.height - height) / 2, width, height });
      return;
    }
    if (!wasDragged || event.type === "pointercancel" || prefersReducedMotion()) return;
    const samples = panSamples.current;
    const first = samples[0],
      last = samples.at(-1);
    if (!first || !last || last.time === first.time || event.timeStamp - last.time > 100) return;
    const rect = svg.current?.getBoundingClientRect();
    if (!rect) return;
    const unit = Math.max(view.width / rect.width, view.height / rect.height);
    const velocity = {
      x: ((last.x - first.x) / (last.time - first.time)) * unit,
      y: ((last.y - first.y) / (last.time - first.time)) * unit,
    };
    if (Math.hypot(velocity.x, velocity.y) / unit < 0.05) return;
    const started = performance.now();
    const tick = (now: number) => {
      const elapsed = now - started;
      setView(momentumView(view, velocity, elapsed));
      if (elapsed < 850 && (Math.hypot(velocity.x, velocity.y) / unit) * Math.exp(-elapsed / 180) > 0.015)
        cameraAnimation.current = requestAnimationFrame(tick);
    };
    cameraAnimation.current = requestAnimationFrame(tick);
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
      restored.current = false;
      sessionRef.current = null;
    };
  }, []);
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
  const waitForPlayback = (duration: number) =>
    new Promise<void>((resolve) => {
      animationDone.current = resolve;
      setTimeout(() => {
        if (animationDone.current === resolve) animationDone.current = null;
        resolve();
      }, duration);
    });
  const run = async (initial: Session, token: number) => {
    let next = initial;
    while (token === generation.current) {
      const target = next.active;
      const result = await queryClient.fetchQuery(routeQuery(next.record, next.region, target, next.current)).then(
        (route) => ({ route }),
        (error: unknown) => ({ error }),
      );
      if (token !== generation.current) return;
      if ("error" in result) {
        fastForward.current = false;
        setSessionValue({
          ...sessionRef.current!,
          status: "error",
          error: result.error instanceof Error ? result.error.message : "경로를 불러오지 못했어요. 다시 시도해 주세요.",
          errorCode: result.error instanceof JourneyRouteError ? result.error.code : undefined,
          replaying: false,
        });
        return;
      }
      const route = result.route;
      const camera = target ? followBox(boxRef.current, route) : routeBox([route]);
      if (camera && !fastForward.current) moveCamera(camera);
      setSessionValue({ ...sessionRef.current!, status: "moving" });
      await Promise.all([
        sheetClosed.current,
        camera && !prefersReducedMotion() && !fastForward.current ? waitForPlayback(CAMERA_SETTLE_MS) : null,
      ]);
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
      if (!prefersReducedMotion() && !fastForward.current) await waitForPlayback(SKETCH_MS);
      if (token !== generation.current) return;
      next = { ...sessionRef.current!, current: target, active: null, status: "idle" };
      setSessionValue(next);
      if (!next.queue.length) {
        if (next.replaying) {
          setSessionValue({ ...next, replaying: false });
          if (fastForward.current) moveCamera(routeBox(next.segments.map((segment) => segment.route)));
        }
        fastForward.current = false;
        return;
      }
      const [first, ...rest] = next.queue;
      next = { ...next, active: first, queue: rest, status: "loading" };
      setSessionValue(next);
    }
  };
  const begin = (record: RecordItem, selectedRegion: Region, queue: Place[] = [], replaying = false) => {
    const token = ++generation.current;
    fastForward.current = false;
    animationDone.current?.();
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
      queue,
      active: null,
      status: "loading",
      error: "",
      current: null,
      replaying,
    };
    setSessionValue(next);
    setHighlight(null);
    showSheet(null);
    void run(next, token);
  };
  const restore = async (record: RecordItem, selectedRegion: Region, places: Place[]) => {
    const token = ++generation.current;
    const base: Session = {
      record,
      region: selectedRegion,
      segments: [],
      queue: [],
      active: null,
      status: "loading",
      error: "",
      current: null,
      replaying: false,
    };
    setSessionValue(base);
    const segments: Segment[] = [];
    let current: Place | null = null;
    for (const [index, target] of [null, ...places].entries()) {
      const result = await queryClient.fetchQuery(routeQuery(record, selectedRegion, target, current)).then(
        (route) => ({ route }),
        (error: unknown) => ({ error }),
      );
      if (token !== generation.current) return;
      if ("error" in result) {
        setSessionValue({
          ...base,
          segments,
          current,
          active: target,
          queue: places.slice(index),
          status: "error",
          error: result.error instanceof Error ? result.error.message : "경로를 불러오지 못했어요. 다시 시도해 주세요.",
          errorCode: result.error instanceof JourneyRouteError ? result.error.code : undefined,
        });
        return;
      }
      segments.push({
        route: result.route,
        target,
        from: target ? (current ?? record.destination) : null,
        to: target ?? record.destination,
        key: Date.now() + Math.random(),
      });
      current = target;
    }
    cancelAnimationFrame(cameraAnimation.current);
    setView(routeBox(segments.map((segment) => segment.route)));
    setSessionValue({ ...base, segments, current, status: "idle", restored: true });
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
    setHighlight(null);
    setSessionValue({ ...next, restored: false });
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
    const next = { ...skipJourneyPlace(current), error: "", errorCode: undefined };
    setSessionValue(next);
    if (next.status === "loading") void run(next, generation.current);
  };
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    for (const key of ["region", "record", "places", "detail"]) params.delete(key);
    if (session) {
      params.set("region", session.region.code);
      params.set("record", session.record.id);
      const places = session.segments.flatMap((segment) => (segment.target ? [segment.target.id] : []));
      if (places.length) params.set("places", places.join(","));
      if (detailOpen) params.set("detail", "1");
    }
    const query = params.toString();
    const url = `${window.location.pathname}${query ? `?${query}` : ""}`;
    if (url !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(null, "", url);
  }, [session, detailOpen]);
  const restoreJourney = useEffectEvent((rows: NonNullable<typeof locations.data>) => {
    setRestoring(false);
    if (sessionRef.current || sheet !== null) return;
    const target = regions.find((item) => item.code === initialUrl.region);
    const row = rows.find((item) => item.id === initialUrl.record);
    const record = target && row && homeReady ? toJourneyRecord(row, target.code) : null;
    if (!target || !record) {
      setDetailOpen(false);
      return;
    }
    setRegion(target);
    void restore(
      record,
      target,
      initialUrl.places.flatMap((id) => record.places.filter((place) => place.id === id)),
    );
  });
  useEffect(() => {
    if (restored.current || locations.isFetching || (!locations.data && !locations.isError)) return;
    restored.current = true;
    restoreJourney(locations.data ?? []);
  }, [locations.data, locations.isFetching, locations.isError]);

  const pressPlace = (place: Place) => {
    const current = sessionRef.current;
    if (current?.status !== "idle" || current.segments.some((segment) => segment.target?.id === place.id)) return;
    void queryClient.prefetchQuery(routeQuery(current.record, current.region, place, current.current));
  };
  const reset = () => {
    generation.current++;
    animationDone.current?.();
    fastForward.current = false;
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
    if (!homeReady && !homeUnavailable) {
      setRegion(selected);
      showSheet(null);
      setAddressOpen(true);
      return;
    }
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
    }, SHEET_EXPAND_MS);
  };
  const finishReplay = () => {
    if (!sessionRef.current?.replaying) return;
    fastForward.current = true;
    setSessionValue({ ...sessionRef.current, restored: true });
    animationDone.current?.();
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
  const activeRecord = locations.data?.find((record) => record.id === session?.record.id);
  const distance = segments.reduce((sum, segment) => sum + segment.route.distance, 0);
  const duration = segments.reduce((sum, segment) => sum + segment.route.duration, 0);
  return (
    <main
      ref={main}
      data-empty={regions.length === 0 ? "" : undefined}
      className={`${styles.page} dark`}
      style={{ "--journey-sketch-duration": `${SKETCH_MS}ms` } as CSSProperties}
      data-direction="forward"
      data-funnel-step
    >
      {session && (
        <div className={styles.recordHeader}>
          <h1 ref={title} tabIndex={-1}>
            {session.region.name}
          </h1>
          <Button
            className={styles.hit}
            color="dark"
            onClick={() => {
              setDetailRecordId(session.record.id);
              setDetailOpen(true);
            }}
            size="medium"
            variant="weak"
          >
            기록 읽기
          </Button>
          {activeRecord && (
            <p className={styles.recordMeta}>
              {activeRecord.activity} · {activeRecord.recorded_at.replaceAll("-", ".")}
            </p>
          )}
        </div>
      )}
      {!session && <h1 className="sr-only">기록 지도</h1>}
      <svg
        ref={svg}
        className={styles.map}
        viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`}
        aria-label="방문 지역 지도"
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          cancelAnimationFrame(cameraAnimation.current);
          if (pointers.current.size) dragged.current = true;
          else {
            dragOrigin.current = { x: event.clientX, y: event.clientY };
            dragged.current = false;
            panSamples.current = [{ x: event.clientX, y: event.clientY, time: event.timeStamp }];
          }
          pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
        }}
        onPointerMove={(event) => {
          const tracked = pointers.current;
          if (!tracked.has(event.pointerId)) return;
          if (!event.buttons) {
            tracked.delete(event.pointerId);
            return;
          }
          const origin = dragOrigin.current;
          if (origin && Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > 6) dragged.current = true;
          if (dragged.current && !event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.setPointerCapture(event.pointerId);
          const [a, b] = [...tracked.values()];
          tracked.set(event.pointerId, { x: event.clientX, y: event.clientY });
          const [nextA, nextB] = [...tracked.values()];
          if (!b) {
            panSamples.current = [
              ...panSamples.current.filter((sample) => event.timeStamp - sample.time <= 100),
              { x: event.clientX, y: event.clientY, time: event.timeStamp },
            ];
            zoomAt(0, 0, 1, nextA.x - a.x, nextA.y - a.y);
            return;
          }
          panSamples.current = [];
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
            true,
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
        <g
          className={styles.districts}
          display={box.width >= 120 ? "none" : undefined}
          opacity={Math.max(0, Math.min(0.65, (120 - box.width) / 80))}
        >
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
          !restoring &&
          regions.map((item) => {
            const p = project(item.longitude, item.latitude);
            return (
              <g
                key={item.code}
                role="button"
                tabIndex={0}
                aria-label={`${item.name} 기록 ${item.count}개`}
                className={styles.node}
                onClick={(event) => {
                  if (!dragged.current && event.timeStamp - dragEndAt.current > 400) chooseRegion(item, event);
                }}
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
        {startPoint && (
          <HouseIcon
            aria-label="내 집"
            className={styles.homeIcon}
            size={unit * 14}
            weight="fill"
            x={startPoint.x - unit * 7}
            y={startPoint.y - unit * 22}
          />
        )}
        {placeLabels(
          completeSegments.flatMap((segment) => (segment.target ? [segment.target] : [])),
          box,
          unit,
          dimensions.width,
        ).map((label) => (
          <g
            key={label.key}
            role="button"
            tabIndex={0}
            className={styles.placeLabel}
            aria-label={
              label.places.length > 1
                ? `${label.places[0].name} 외 ${label.places.length - 1}곳 보기`
                : `${label.places[0].name} 위치 보기`
            }
            onClick={(event) => {
              if (dragged.current || event.timeStamp - dragEndAt.current <= 400) return;
              if (label.places.length === 1) focusPlace(label.places[0]);
              else {
                setPlaceChoices(label.places);
                showSheet("places");
              }
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              if (label.places.length === 1) focusPlace(label.places[0]);
              else {
                setPlaceChoices(label.places);
                showSheet("places");
              }
            }}
          >
            <rect
              className={styles.labelHit}
              x={label.x}
              y={label.y - 6 * unit}
              width={label.width}
              height={44 * unit}
              rx={22 * unit}
            />
            <rect
              className={styles.labelSurface}
              x={label.x}
              y={label.y}
              width={label.width}
              height={32 * unit}
              rx={16 * unit}
              strokeWidth={unit}
            />
            <text x={label.x + 10 * unit} y={label.y + 21 * unit} fontSize={11 * unit}>
              {label.name}
              {label.places.length > 1 && <tspan className={styles.labelCount}> +{label.places.length - 1}</tspan>}
            </text>
          </g>
        ))}
      </svg>
      <PageBackButton fallbackHref="/" />
      <FixedToolbar className="justify-end">
        {session ? (
          <JourneyActions
            actions={[
              {
                label: "전체 경로 보기",
                icon: ArrowsInSimpleIcon,
                onSelect: () => moveCamera(routeBox(session.segments.map((segment) => segment.route))),
              },
              {
                label: "다시 보기",
                disabled: session.replaying,
                icon: PlayIcon,
                onSelect: () => {
                  begin(session.record, session.region, pickedJourneyPlaces(session), true);
                  title.current?.focus();
                },
              },
              {
                label: "이 지역 기록 목록",
                icon: ListBulletsIcon,
                onSelect: () => {
                  setRegion(session.region);
                  setSubregion(null);
                  showSheet("records");
                },
              },
              {
                label: "전국 지도로 돌아가기",
                icon: MapTrifoldIcon,
                onSelect: () => {
                  reset();
                  requestAnimationFrame(() => regionsButton.current?.focus());
                },
              },
            ]}
          />
        ) : (
          !restoring &&
          regions.length > 0 && (
            <div className={styles.actions}>
              <LiquidGlassButton
                ref={regionsButton}
                className="min-w-0 px-5 text-foreground text-sm"
                onClick={() => showSheet("regions")}
              >
                지역 목록
              </LiquidGlassButton>
            </div>
          )
        )}
      </FixedToolbar>
      {!session && !restoring && !regions.length && (
        <div className={styles.empty}>
          <h2>함께한 곳을 남겨볼까요?</h2>
          <p>
            장소가 담긴 기록이 쌓이면
            <br />
            여기서 다시 돌아볼 수 있어요.
          </p>
          <Button nativeButton={false} render={<PressLink href="/records/new" />} size="large">
            기록 남기기
          </Button>
        </div>
      )}
      {session && (
        <div className={styles.details}>
          {session.status === "error" && (
            <div role="alert" className={styles.error}>
              <div>
                <strong>
                  {session.active
                    ? `${session.active.name}까지 길을 잇지 못했어요`
                    : "집에서 출발하는 길을 잇지 못했어요"}
                </strong>
                <p>{session.error}</p>
              </div>
              {session.errorCode !== "NO_ROUTE" && (
                <Button className={styles.hit} color="dark" onClick={() => recover(false)} size="medium" variant="weak">
                  다시 시도
                </Button>
              )}
              {session.active && (
                <Button className={styles.hit} color="dark" onClick={() => recover(true)} size="medium" variant="weak">
                  건너뛰기
                </Button>
              )}
            </div>
          )}
          {session.replaying && (
            <div className={styles.replayStatus}>
              <span>기억을 다시 잇고 있어요</span>
              <Button color="dark" variant="weak" onClick={finishReplay} disabled={session.restored}>
                바로 끝내기
              </Button>
            </div>
          )}
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
                className={cn(PRESS_FEEDBACK, FOCUS_RING)}
                type="button"
                onClick={() => selectPlace(place)}
                onPointerDown={(event) => {
                  if (event.button === 0) pressPlace(place);
                }}
                data-selected={selectedPlaceIds.has(place.id) ? "" : undefined}
                data-error={session.status === "error" && session.active?.id === place.id ? "" : undefined}
              >
                {session.status === "error" && session.active?.id === place.id && (
                  <WarningCircleIcon aria-hidden="true" size={16} />
                )}
                {place.name}
                {selectedPlaceIds.has(place.id) && <span className="sr-only"> (선택됨)</span>}
              </button>
            ))}
          </div>
          <div className={styles.metrics}>
            <strong>
              {segments.length ? (
                <AnimatedNumber
                  value={distance / 1000}
                  format={(value) => value.toFixed(1)}
                  instant={session.restored}
                />
              ) : (
                "—"
              )}
              <small> km</small>
            </strong>
            <em>
              {segments.length ? (
                <AnimatedNumber
                  instant={session.restored}
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
        </div>
      )}
      {!session && regions.length > 0 && !homeReady && (
        <div className={styles.homeNotice}>
          {homeUnavailable ? (
            <LoadErrorAlert title="집 주소를 불러오지 못했어요." onRetry={() => router.refresh()} />
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
        snapPoints={content === "records" ? [1] : [compactHeight, 1]}
        snapPoint={snapPoint}
        onSnapPointChange={setSnapPoint}
        open={sheet !== null}
        onOpenChangeComplete={(open) => {
          if (open) return;
          resolveSheetClosed.current?.();
          resolveSheetClosed.current = null;
          if (!sessionRef.current && !addressOpen) setRegion(null);
        }}
        onOpenChange={(open) => {
          if (!open) showSheet(null);
        }}
        showSwipeHandle
      >
        <BottomSheet.Content
          className="dark motion-safe:duration-250 motion-safe:ease-[cubic-bezier(0.32,0.72,0,1)]"
          style={{ "--drawer-content-max-height": `min(700px, ${FULL_SHEET_HEIGHT})` } as CSSProperties}
          finalFocus={() => {
            if (addressOpen || detailOpen) return false;
            if (sessionRef.current) return title.current;
            if (opener.current instanceof SVGElement && opener.current.isConnected) {
              opener.current.focus();
              return false;
            }
            return true;
          }}
        >
          {content === "records" && homeReady && (
            <BottomSheet.Close
              render={<IconButton aria-label="기록 목록 닫기" icon={XIcon} className="absolute top-7 right-3 z-10" />}
            />
          )}
          {content === "records" && homeReady && locations.data && region ? (
            <RegionRecordList
              isDetail={false}
              currentRecordId={session?.record.id}
              onRecordOpen={(recordId) => {
                const record = journeyRecord(recordId);
                if (record) begin(record, region);
              }}
              onRecordPress={(recordId) => {
                const record = journeyRecord(recordId);
                if (record) void queryClient.prefetchQuery(routeQuery(record, region, null, null));
              }}
              onSubregionChange={setSubregion}
              records={locations.data}
              region={regionMaps.find(({ code }) => code === region.code) ?? null}
              subregion={subregion}
            />
          ) : (
            <>
              <BottomSheet.Header
                ref={setSheetHeader}
                className="relative text-left group-data-[swipe-axis=y]/bottom-sheet-popup:text-left"
              >
                <BottomSheet.Close
                  render={<IconButton aria-label="목록 닫기" icon={XIcon} className="absolute top-2 right-3" />}
                />
                <BottomSheet.Title className="pr-10 text-left font-bold text-xl">
                  {content === "regions"
                    ? "방문한 지역"
                    : content === "places"
                      ? `여기에 함께한 장소 ${placeChoices.length}곳`
                      : content === "choices"
                        ? "어느 지역의 기록을 볼까요?"
                        : (region?.name ?? "")}
                </BottomSheet.Title>
                {content === "regions" && (
                  <BottomSheet.Description>다시 보고 싶은 지역을 선택해 주세요.</BottomSheet.Description>
                )}
              </BottomSheet.Header>
              <div
                ref={setSheetBody}
                className="min-h-0 overflow-y-auto px-5 pt-4 pb-[calc(--spacing(8)+env(safe-area-inset-bottom))]"
              >
                {content === "places" && (
                  <>
                    {placeChoices.map((place, index) => (
                      <ListRow
                        key={place.id}
                        className="px-1"
                        onClick={() => {
                          showSheet(null);
                          focusPlace(place);
                        }}
                        right={<CaretRightIcon aria-hidden="true" size={20} />}
                      >
                        <ListRowTexts title={place.name} description={`장소 ${index + 1}`} />
                      </ListRow>
                    ))}
                    <Button
                      className="mt-4"
                      fullWidth
                      size="large"
                      onClick={() => {
                        showSheet(null);
                        moveCamera(placesBox(placeChoices, dimensions));
                      }}
                    >
                      지도에서 따로 보기
                    </Button>
                  </>
                )}
                {(content === "regions" || content === "choices") &&
                  (content === "choices" ? choices : regions).map((item) => (
                    <ListRow
                      key={item.code}
                      className="px-1"
                      onClick={() => openRegion(item)}
                      right={<CaretRightIcon aria-hidden="true" size={20} />}
                    >
                      <ListRowTexts description={`기록 ${item.count}개`} title={item.name} />
                    </ListRow>
                  ))}
                {content === "records" && !homeReady && (
                  <div className={styles.sheetNotice}>
                    {!homeUnavailable && (
                      <p>기록까지 이어지는 길은 내 집에서 출발해요. 집 주소를 먼저 등록해 주세요.</p>
                    )}
                    {homeUnavailable ? (
                      <LoadErrorAlert title="집 주소를 불러오지 못했어요." onRetry={() => router.refresh()} />
                    ) : (
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
                {content === "records" && homeReady && locations.isPending && (
                  <div className={styles.skeleton} aria-label="기록을 불러오는 중">
                    <i />
                    <i />
                    <i />
                  </div>
                )}
                {content === "records" && homeReady && locations.isError && (
                  <LoadErrorAlert
                    title="기록을 불러오지 못했어요."
                    onRetry={() => void locations.refetch()}
                    retrying={locations.isFetching}
                  />
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
          deletedRegion.current = sessionRef.current?.region ?? null;
        }}
        onCloseComplete={() => {
          setDetailRecordId(null);
          const previous = deletedRegion.current;
          if (!previous) return;
          deletedRegion.current = null;
          generation.current++;
          setSessionValue(null);
          setHighlight(null);
          const remaining = (locations.data ?? []).filter(
            (record) => record.id !== detailRecordId && toJourneyRecord(record, previous.code),
          );
          if (remaining.length) {
            setRegion(previous);
            setSubregion(null);
            showSheet("records");
          } else reset();
        }}
        onOpenChange={setDetailOpen}
        open={detailOpen}
        record={detailRecordId ? { id: detailRecordId } : null}
      />
    </main>
  );
}
