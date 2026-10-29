"use client";

import {
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { ArrowsInSimpleIcon, ListBulletsIcon, MapTrifoldIcon, PlayIcon } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

import { recordLocationsQueryOptions } from "@/entities/record";
import { HomeAddressSheet } from "@/features/home-address/ui/home-address-sheet";
import { getPageNavigation } from "@/shared/lib/navigation/page-navigation";
import { FixedToolbar } from "@/shared/ui/layouts";
import { PageBackButton } from "@/shared/ui/layouts/page-back-button";
import { LiquidGlassButton } from "@/shared/ui/liquid-glass-button";
import { SHEET_EXPAND_MS, useCompactSnapPoint } from "@/shared/ui/use-compact-snap-point";
import { RecordDetailBottomSheet } from "@/widgets/record-detail";

import { JourneyRouteError, journeyRouteQuery } from "../api/route-query";
import { readJourneyUrlState, toJourneySearch } from "../model/journey-url-state";
import {
  type Box,
  constrainView,
  followBox,
  momentumView,
  national,
  placesBox,
  project,
  routeBox,
} from "../model/map-view";
import { prefersReducedMotion, SKETCH_MS } from "../model/motion";
import { enqueueJourneyPlace, pickedJourneyPlaces, skipJourneyPlace } from "../model/queue";
import { type JourneyRecord, toJourneyRecord } from "../model/record";
import type {
  JourneySheetKind,
  JourneyPlace as Place,
  JourneyRegion as Region,
  JourneySegment as Segment,
  JourneySession as Session,
} from "../model/types";
import { JourneyActions } from "./header/journey-actions";
import { RecordHeader } from "./header/record-header";
import styles from "./journey-map.module.css";
import { DistrictShapes, MapShapes } from "./map/map-shapes";
import { PlaceLabels } from "./map/place-labels";
import { NODE_HIT_RADIUS, RegionNodes } from "./map/region-nodes";
import { RouteLayer } from "./map/route-layer";
import { EmptyJourney, HomeNotice } from "./panel/journey-notices";
import { JourneyPanel } from "./panel/journey-panel";
import { JourneySheet, RegionRecords } from "./sheet/journey-sheet";
import { RegionChoices } from "./sheet/region-choices";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const MIN_VIEW_WIDTH = 0.02;
const CAMERA_SETTLE_MS = 350;
const SHEET_CLOSE_FALLBACK_MS = 700;

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

  const routeQuery = (record: JourneyRecord, region: Region, target: Place | null, from: Place | null) =>
    journeyRouteQuery(member.id, homeVersion, record, region, target, from);

  const [sheet, setSheet] = useState<JourneySheetKind | null>(null);
  const [content, setContent] = useState(sheet);
  if (sheet !== null && sheet !== content) setContent(sheet);
  const opener = useRef<Element | null>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const regionsButton = useRef<HTMLButtonElement>(null);
  const [choices, setChoices] = useState<Region[]>([]);
  const [placeChoices, setPlaceChoices] = useState<Place[]>([]);
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
  const [initialUrl] = useState(() =>
    readJourneyUrlState(searchParams, typeof window !== "undefined" && getPageNavigation(window).traversal),
  );
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

  const showSheet = (next: JourneySheetKind | null) => {
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
    const start = boxRef.current;
    const started = performance.now();
    if (prefersReducedMotion()) {
      setView(next);
      return;
    }

    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / 650);
      const eased = 1 - (1 - progress) ** 3;
      setView({
        x: start.x + (next.x - start.x) * eased,
        y: start.y + (next.y - start.y) * eased,
        width: start.width + (next.width - start.width) * eased,
        height: start.height + (next.height - start.height) * eased,
      });
      if (progress < 1) cameraAnimation.current = requestAnimationFrame(tick);
    };
    cameraAnimation.current = requestAnimationFrame(tick);
  };

  const zoomAt = (clientX: number, clientY: number, factor: number, panX = 0, panY = 0, elastic = false) => {
    const rect = svg.current?.getBoundingClientRect();
    if (!rect) return;

    const view = boxRef.current;
    const scale = Math.max(view.width / rect.width, view.height / rect.height);
    const anchorX = view.x + view.width / 2 + (clientX - rect.left - rect.width / 2) * scale;
    const anchorY = view.y + view.height / 2 + (clientY - rect.top - rect.height / 2) * scale;
    const desired = view.width * factor;
    const limited = Math.max(MIN_VIEW_WIDTH, Math.min(400, desired));
    const ratio = (elastic ? limited + (desired - limited) * 0.15 : limited) / view.width;
    setView(
      constrainView({
        x: anchorX + (view.x - anchorX) * ratio - panX * scale * ratio,
        y: anchorY + (view.y - anchorY) * ratio - panY * scale * ratio,
        width: view.width * ratio,
        height: view.height * ratio,
      }),
    );
  };

  const releasePointer = (event: PointerEvent) => {
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
    const first = samples[0];
    const last = samples.at(-1);
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

  const canTap = (event: MouseEvent) => !dragged.current && event.timeStamp - dragEndAt.current > 400;

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

  const begin = (record: JourneyRecord, selectedRegion: Region, queue: Place[] = [], replaying = false) => {
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

  const restore = async (record: JourneyRecord, selectedRegion: Region, places: Place[]) => {
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
    const point = project(place.longitude, place.latitude);
    const view = boxRef.current;
    moveCamera({ ...view, x: point.x - view.width / 2, y: point.y - view.height * 0.45 });
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
    const search = toJourneySearch(
      window.location.search,
      session && {
        region: session.region.code,
        record: session.record.id,
        places: session.segments.flatMap((segment) => (segment.target ? [segment.target.id] : [])),
        detail: detailOpen,
      },
    );
    const url = `${window.location.pathname}${search}`;
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

    const view = boxRef.current;
    const scale = Math.max(view.width / rect.width, view.height / rect.height);
    return {
      x: view.x + view.width / 2 + (clientX - rect.left - rect.width / 2) * scale,
      y: view.y + view.height / 2 + (clientY - rect.top - rect.height / 2) * scale,
    };
  };

  const chooseRegion = (selected: Region, tap?: { clientX: number; clientY: number }) => {
    const point = tap && toMapPoint(tap.clientX, tap.clientY);
    const nearby = point
      ? regions.filter((item) => {
          const position = project(item.longitude, item.latitude);
          return Math.hypot(position.x - point.x, position.y - point.y) <= unit * NODE_HIT_RADIUS;
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

  const registerHome = () => {
    showSheet(null);
    setAddressOpen(true);
  };

  const unit = Math.max(box.width / dimensions.width, box.height / dimensions.height);
  const completeSegments = session?.status === "drawing" ? session.segments.slice(0, -1) : (session?.segments ?? []);
  const activeRecord = locations.data?.find((record) => record.id === session?.record.id);

  return (
    <main
      ref={main}
      data-empty={regions.length === 0 ? "" : undefined}
      className={`${styles.page} dark`}
      style={{ "--journey-sketch-duration": `${SKETCH_MS}ms` } as CSSProperties}
      data-direction="forward"
      data-funnel-step
    >
      {session ? (
        <RecordHeader
          titleRef={title}
          regionName={session.region.name}
          record={activeRecord}
          onRead={() => {
            setDetailRecordId(session.record.id);
            setDetailOpen(true);
          }}
        />
      ) : (
        <h1 className="sr-only">기록 지도</h1>
      )}
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

          const midX = (a.x + b.x) / 2;
          const midY = (a.y + b.y) / 2;
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
        <DistrictShapes viewWidth={box.width} />
        {session && (
          <RouteLayer
            segments={session.segments}
            complete={completeSegments}
            drawing={session.status === "drawing"}
            highlight={highlight}
            unit={unit}
          />
        )}
        {!session && !restoring && (
          <RegionNodes regions={regions} unit={unit} viewWidth={box.width} canTap={canTap} onChoose={chooseRegion} />
        )}
        <PlaceLabels
          places={completeSegments.flatMap((segment) => (segment.target ? [segment.target] : []))}
          view={box}
          unit={unit}
          viewportWidth={dimensions.width}
          canTap={canTap}
          onFocus={focusPlace}
          onChoose={(places) => {
            setPlaceChoices(places);
            showSheet("places");
          }}
        />
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
      {!session && !restoring && !regions.length && <EmptyJourney />}
      {session && (
        <JourneyPanel
          session={session}
          onRecover={recover}
          onFinishReplay={finishReplay}
          onSelectPlace={selectPlace}
          onPressPlace={pressPlace}
        />
      )}
      {!session && regions.length > 0 && !homeReady && (
        <HomeNotice unavailable={homeUnavailable} onRegister={() => setAddressOpen(true)} />
      )}
      <JourneySheet
        open={sheet !== null}
        kind={content}
        compactHeight={compactHeight}
        snapPoint={snapPoint}
        onSnapPointChange={setSnapPoint}
        onClose={() => showSheet(null)}
        onCloseComplete={() => {
          resolveSheetClosed.current?.();
          resolveSheetClosed.current = null;
          if (!sessionRef.current && !addressOpen) setRegion(null);
        }}
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
        {content === "records" ? (
          <RegionRecords
            region={region}
            homeReady={homeReady}
            homeUnavailable={homeUnavailable}
            currentRecordId={session?.record.id}
            subregion={subregion}
            onSubregionChange={setSubregion}
            onRecordOpen={(recordId) => {
              const record = journeyRecord(recordId);
              if (record && region) begin(record, region);
            }}
            onRecordPress={(recordId) => {
              const record = journeyRecord(recordId);
              if (record && region) void queryClient.prefetchQuery(routeQuery(record, region, null, null));
            }}
            onRegisterHome={registerHome}
          />
        ) : (
          content && (
            <RegionChoices
              kind={content}
              regions={content === "choices" ? choices : regions}
              places={placeChoices}
              headerRef={setSheetHeader}
              bodyRef={setSheetBody}
              onRegion={openRegion}
              onPlace={(place) => {
                showSheet(null);
                focusPlace(place);
              }}
              onPlacesTogether={() => {
                showSheet(null);
                moveCamera(placesBox(placeChoices, dimensions));
              }}
            />
          )
        )}
      </JourneySheet>
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
