"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";

import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";

import { BottomSheet } from "@/shared/ui/bottom-sheet";

import boundaries from "../model/map-boundaries.json";
import { enqueueJourneyPlace, skipJourneyPlace } from "../model/queue";
import styles from "./journey-map.module.css";

type Point = { latitude: number; longitude: number };
type Place = Point & { id: string; name: string };
type Region = Point & { code: string; name: string; count: number };
type RecordItem = {
  id: string;
  title: string;
  date: string;
  memo: string | null;
  places: Place[];
  destination: Point & { name: string };
};
type Route = { points: [number, number][]; distance: number; duration: number };
type Segment = { route: Route; target: Place | null; key: number };
type Session = {
  record: RecordItem;
  region: Region;
  segments: Segment[];
  queue: Place[];
  active: Place | null;
  status: "loading" | "drawing" | "idle" | "error";
  error: string;
  current: Place | null;
};
type Box = { x: number; y: number; width: number; height: number };
const national: Box = { x: 90, y: 15, width: 260, height: 355 };
const project = (longitude: number, latitude: number) => ({
  x: 110 + (longitude - 125.5) * 49 * Math.cos((36 * Math.PI) / 180),
  y: 23 + (39.4 - latitude) * 49,
});
const routeBox = (routes: Route[]): Box => {
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
  if (!Number.isFinite(x)) return national;
  const width = Math.max(0.5, maxX - x),
    height = Math.max(0.75, maxY - y);
  const paddedWidth = Math.max(width * 1.8, height * 0.75, 0.9),
    paddedHeight = Math.max(height * 1.8, width * 1.2, 1.4);
  return {
    x: x + width / 2 - paddedWidth / 2,
    y: y + height / 2 - paddedHeight / 2,
    width: paddedWidth,
    height: paddedHeight,
  };
};
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const MapShapes = memo(function MapShapes() {
  return (
    <g className={styles.land}>
      {boundaries.regions.map((item) => (
        <path key={item.code} d={item.path} />
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
      segment.route.points
        .map(([longitude, latitude], index) => {
          const point = project(longitude, latitude);
          return `${index ? "L" : "M"}${point.x},${point.y}`;
        })
        .join(""),
    [segment.route.points],
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

function AnimatedNumber({ value, decimals }: { value: number; decimals: number }) {
  const [display, setDisplay] = useState(0);
  const previous = useRef(0);
  useEffect(() => {
    const start = previous.current;
    const started = performance.now();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      previous.current = value;
      return;
    }
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / 600);
      const current = start + (value - start) * (1 - (1 - t) ** 3);
      previous.current = current;
      setDisplay(current);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <>{display.toFixed(decimals)}</>;
}

export function JourneyMap({
  regions,
  hasHome,
  homeUnavailable,
  memberId,
}: {
  regions: Region[];
  hasHome: boolean;
  homeUnavailable: boolean;
  memberId: string;
}) {
  const [region, setRegion] = useState<Region | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const generation = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const [sheet, setSheet] = useState<"regions" | "records" | "memo" | null>(null);
  const [box, setBox] = useState<Box>(national);
  const boxRef = useRef(box);
  const cameraAnimation = useRef(0);
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{ x: number; y: number; box: Box } | null>(null);
  const chips = useRef<HTMLDivElement>(null);
  const chipDrag = useRef<{ x: number; scroll: number; moved: boolean } | null>(null);
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
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
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
      controller.current?.abort();
      generation.current++;
    };
  }, []);
  const query = useInfiniteQuery({
    queryKey: ["journey-records", memberId, region?.code],
    enabled: Boolean(region && sheet === "records"),
    initialPageParam: 0,
    queryFn: async ({ pageParam, signal }) => {
      const params = new URLSearchParams({ region: region!.code, page: String(pageParam) });
      const response = await fetch(`/journey/records?${params}`, { signal });
      if (!response.ok) throw new Error("기록을 불러오지 못했어요.");
      return (await response.json()) as { records: RecordItem[]; nextPage: number | null };
    },
    getNextPageParam: (last) => last.nextPage ?? undefined,
    staleTime: 60_000,
  });
  const run = async (initial: Session, token: number) => {
    let next = initial;
    while (token === generation.current) {
      const target = next.active;
      const params = new URLSearchParams({ recordId: next.record.id, region: next.region.code });
      if (target) {
        params.set("placeId", target.id);
        if (next.current) params.set("fromPlaceId", next.current.id);
      }
      const abort = new AbortController();
      controller.current = abort;
      try {
        const response = await fetch(`/journey/directions?${params}`, { signal: abort.signal, cache: "no-store" });
        const body = (await response.json()) as { route?: Route; error?: string };
        if (!response.ok || !body.route) throw new Error(body.error ?? "경로를 불러오지 못했어요.");
        if (token !== generation.current) return;
        const segment = { route: body.route, target, key: Date.now() + Math.random() };
        next = { ...sessionRef.current!, segments: [...sessionRef.current!.segments, segment], status: "drawing" };
        setSessionValue(next);
        moveCamera(routeBox([body.route]));
        await sleep(window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 900);
        if (token !== generation.current) return;
        next = { ...sessionRef.current!, current: target, active: null, status: "idle" };
        setSessionValue(next);
        if (!next.queue.length) return;
        const [first, ...rest] = next.queue;
        next = { ...next, active: first, queue: rest, status: "loading" };
        setSessionValue(next);
      } catch (error) {
        if (token !== generation.current || abort.signal.aborted) return;
        next = {
          ...sessionRef.current!,
          status: "error",
          error: error instanceof Error ? error.message : "경로를 불러오지 못했어요.",
        };
        setSessionValue(next);
        return;
      }
    }
  };
  const begin = (record: RecordItem, selectedRegion: Region, replay: Place[] = []) => {
    controller.current?.abort();
    const token = ++generation.current;
    const next: Session = {
      record,
      region: selectedRegion,
      segments: [],
      queue: replay,
      active: null,
      status: "loading",
      error: "",
      current: null,
    };
    setSessionValue(next);
    setSheet(null);
    void run(next, token);
  };
  const selectPlace = (place: Place) => {
    const current = sessionRef.current;
    if (!current) return;
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
  const reset = () => {
    generation.current++;
    controller.current?.abort();
    setSessionValue(null);
    setRegion(null);
    setSheet(null);
    moveCamera(national);
  };
  const openRegion = (selected: Region) => {
    setRegion(selected);
    setSheet("records");
    const p = project(selected.longitude, selected.latitude);
    moveCamera({ x: p.x - 32, y: p.y - 48, width: 64, height: 96 });
  };
  const unit = Math.max(box.width / dimensions.width, box.height / dimensions.height);
  const completeSegments = session?.status === "drawing" ? session.segments.slice(0, -1) : (session?.segments ?? []);
  const distance = completeSegments.reduce((sum, segment) => sum + segment.route.distance, 0);
  const duration = completeSegments.reduce((sum, segment) => sum + segment.route.duration, 0);
  return (
    <main className={styles.page}>
      <svg
        ref={svg}
        className={styles.map}
        viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`}
        aria-label="방문 지역 지도"
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          cancelAnimationFrame(cameraAnimation.current);
          drag.current = { x: event.clientX, y: event.clientY, box: boxRef.current };
        }}
        onPointerMove={(event) => {
          if (!drag.current) return;
          const dx = (event.clientX - drag.current.x) * unit,
            dy = (event.clientY - drag.current.y) * unit;
          setView({ ...drag.current.box, x: drag.current.box.x - dx, y: drag.current.box.y - dy });
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
        onWheel={(event) => {
          cancelAnimationFrame(cameraAnimation.current);
          const factor = event.deltaY > 0 ? 1.2 : 1 / 1.2;
          const b = boxRef.current;
          const width = Math.max(10, Math.min(400, b.width * factor));
          const height = (b.height * width) / b.width;
          setView({ x: b.x + (b.width - width) / 2, y: b.y + (b.height - height) / 2, width, height });
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
                onClick={() => openRegion(item)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openRegion(item);
                  }
                }}
              >
                <circle cx={p.x} cy={p.y} r={unit * 15} fill="transparent" />
                <circle cx={p.x} cy={p.y} r={unit * 4} className={styles.regionNode} />
                <text x={p.x + unit * 8} y={p.y + unit * 4} fontSize={unit * 12}>
                  {item.name}
                </text>
              </g>
            );
          })}
        {session?.segments[0]?.route.points[0] &&
          (() => {
            const [longitude, latitude] = session.segments[0].route.points[0];
            const point = project(longitude, latitude);
            return <circle cx={point.x} cy={point.y} r={unit * 3.5} className={styles.previous} />;
          })()}
        {session &&
          completeSegments.map((segment, index) => {
            const point = segment.target ?? session.record.destination;
            const p = project(point.longitude, point.latitude);
            const isCurrent = index === completeSegments.length - 1 && session.status !== "drawing";
            return (
              <g key={`point-${segment.key}`}>
                <circle cx={p.x} cy={p.y} r={unit * 3.5} className={isCurrent ? styles.arrival : styles.previous} />
                {isCurrent && <circle cx={p.x} cy={p.y} r={unit * 9} strokeWidth={unit} className={styles.pulse} />}
              </g>
            );
          })}
      </svg>
      <header className={styles.header}>
        <Link href="/" aria-label="홈으로">
          ←
        </Link>
        <span>우리의 발자취</span>
        {session ? (
          <button type="button" onClick={reset}>
            전국 지도
          </button>
        ) : (
          <button type="button" onClick={() => setSheet("regions")}>
            지역 목록
          </button>
        )}
      </header>
      {!session && (
        <div className={styles.intro}>
          <p>함께한 순간을 따라</p>
          <strong>어디로 떠나볼까요?</strong>
          <span>지도에서 방문한 지역을 선택해 주세요.</span>
          {!regions.length && <span>아직 방문 지역이 있는 기록이 없어요.</span>}
        </div>
      )}
      {session && (
        <div className={styles.details}>
          <div className={styles.tools}>
            <button
              type="button"
              onClick={() => moveCamera(routeBox(session.segments.map((segment) => segment.route)))}
            >
              전체 경로 보기
            </button>
            <button
              type="button"
              onClick={() =>
                begin(
                  session.record,
                  session.region,
                  completeSegments.flatMap((segment) => (segment.target ? [segment.target] : [])),
                )
              }
            >
              다시 보기
            </button>
            {session.record.memo && (
              <button type="button" onClick={() => setSheet("memo")}>
                기록 읽기
              </button>
            )}
          </div>
          <div
            ref={chips}
            className={styles.chips}
            onPointerDown={(event) => {
              if (event.pointerType !== "mouse") return;
              chipDrag.current = { x: event.clientX, scroll: event.currentTarget.scrollLeft, moved: false };
            }}
            onPointerMove={(event) => {
              const d = chipDrag.current;
              if (!d) return;
              if (Math.abs(event.clientX - d.x) > 5) d.moved = true;
              event.currentTarget.scrollLeft = d.scroll - (event.clientX - d.x);
            }}
            onPointerLeave={() => {
              chipDrag.current = null;
            }}
            onClickCapture={(event) => {
              if (chipDrag.current?.moved) {
                event.preventDefault();
                event.stopPropagation();
              }
              chipDrag.current = null;
            }}
          >
            {session.record.places.map((place) => (
              <button
                key={place.id}
                type="button"
                onClick={() => selectPlace(place)}
                aria-pressed={session.current?.id === place.id}
              >
                {place.name}
                {(session.active?.id === place.id || session.queue.some((p) => p.id === place.id)) && " · 대기"}
              </button>
            ))}
          </div>
          <div className={styles.metrics}>
            <div>
              <span>나의 집에서 이어진 거리</span>
              <strong>
                {completeSegments.length ? <AnimatedNumber value={distance / 1000} decimals={1} /> : "—"}
                <small> km</small>
              </strong>
            </div>
            <div>
              <span>자동차 예상 시간</span>
              <strong>
                {completeSegments.length ? <AnimatedNumber value={duration / 60} decimals={0} /> : "—"}
                <small> 분</small>
              </strong>
            </div>
          </div>
          <p className={styles.note}>
            {session.status === "loading"
              ? "경로를 불러오고 있어요"
              : session.status === "drawing"
                ? "길을 그리고 있어요"
                : "선택한 순서로 이은 자동차 추천 경로예요"}
          </p>
          {session.status === "error" && (
            <div role="alert" className={styles.error}>
              <span>{session.error}</span>
              <button type="button" onClick={() => recover(false)}>
                다시 시도
              </button>
              {session.active && (
                <button type="button" onClick={() => recover(true)}>
                  건너뛰기
                </button>
              )}
              {!hasHome && <Link href="/settings">주소 설정</Link>}
            </div>
          )}
        </div>
      )}
      <div className={styles.zoomControls}>
        <button
          type="button"
          aria-label="지도 확대"
          onClick={() => {
            const b = boxRef.current;
            moveCamera({
              x: b.x + b.width * 0.125,
              y: b.y + b.height * 0.125,
              width: b.width * 0.75,
              height: b.height * 0.75,
            });
          }}
        >
          +
        </button>
        <button
          type="button"
          aria-label="지도 축소"
          onClick={() => {
            const b = boxRef.current;
            moveCamera({
              x: b.x - b.width / 6,
              y: b.y - b.height / 6,
              width: (b.width * 4) / 3,
              height: (b.height * 4) / 3,
            });
          }}
        >
          −
        </button>
      </div>
      <details className={styles.attribution}>
        <summary aria-label="지도 및 경로 출처">ⓘ</summary>
        <div>
          지도:{" "}
          <a href="https://www.geoboundaries.org/api/current/gbOpen/KOR/ADM2/" target="_blank" rel="noreferrer">
            geoBoundaries
          </a>{" "}
          /{" "}
          <a href="https://www.citypopulation.de/en/southkorea/admin/" target="_blank" rel="noreferrer">
            citypopulation.de
          </a>{" "}
          (2020 · CC BY 3.0)
          <br />
          경로: Kakao Mobility
        </div>
      </details>
      {!session && (!hasHome || homeUnavailable) && (
        <div className={styles.homeNotice}>
          {homeUnavailable ? "집 주소를 불러오지 못했어요." : "길을 따라가려면 집 주소를 등록해 주세요."}{" "}
          <Link href="/settings">설정하기 →</Link>
        </div>
      )}
      <BottomSheet
        snapPoints={sheet === "memo" ? [0.5, 0.9] : undefined}
        defaultSnapPoint={sheet === "memo" ? 0.5 : undefined}
        open={sheet !== null}
        onOpenChange={(open) => {
          if (!open) setSheet(null);
        }}
        showSwipeHandle
      >
        <BottomSheet.Content className="max-h-[85dvh]">
          <BottomSheet.Header>
            <BottomSheet.Title>
              {sheet === "regions" ? "방문한 지역" : sheet === "memo" ? "기록 읽기" : region?.name}
            </BottomSheet.Title>
            <BottomSheet.Description>
              {sheet === "records"
                ? "함께했던 기록을 선택해 주세요."
                : sheet === "regions"
                  ? "다시 보고 싶은 지역을 선택해 주세요."
                  : session?.record.title}
            </BottomSheet.Description>
          </BottomSheet.Header>
          <div className="min-h-0 overflow-y-auto px-5 pt-4 pb-8">
            {sheet === "regions" &&
              regions.map((item) => (
                <button className={styles.row} type="button" key={item.code} onClick={() => openRegion(item)}>
                  <span>{item.name}</span>
                  <span>{item.count}개 기록 →</span>
                </button>
              ))}
            {sheet === "records" && (
              <>
                {query.isPending && (
                  <div className={styles.skeleton} aria-label="기록을 불러오는 중">
                    <i />
                    <i />
                    <i />
                  </div>
                )}
                {query.isError && (
                  <p>
                    기록을 불러오지 못했어요.{" "}
                    <button type="button" onClick={() => void query.refetch()}>
                      다시 시도
                    </button>
                  </p>
                )}
                {query.data?.pages
                  .flatMap((page) => page.records)
                  .map((item) => (
                    <button
                      type="button"
                      className={styles.row}
                      key={item.id}
                      onClick={() => region && begin(item, region)}
                    >
                      <span>
                        <b>{item.title}</b>
                        <small>{item.date}</small>
                      </span>
                      <span>→</span>
                    </button>
                  ))}
                {query.hasNextPage && (
                  <button
                    className={styles.more}
                    type="button"
                    disabled={query.isFetchingNextPage}
                    onClick={() => void query.fetchNextPage()}
                  >
                    {query.isFetchingNextPage ? "불러오는 중" : "더 보기"}
                  </button>
                )}
              </>
            )}
            {sheet === "memo" && <p className="whitespace-pre-wrap leading-7">{session?.record.memo}</p>}
          </div>
        </BottomSheet.Content>
      </BottomSheet>
    </main>
  );
}
