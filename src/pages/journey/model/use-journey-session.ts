"use client";

import { useEffect, useRef, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { JourneyRouteError, type journeyRouteQuery } from "../api/route-query";
import { followBox, project, routeBox } from "./map-view";
import { prefersReducedMotion, SKETCH_MS } from "./motion";
import { enqueueJourneyPlace, skipJourneyPlace } from "./queue";
import type { JourneyRecord } from "./record";
import type { JourneyPlace, JourneyRegion, JourneyRoute, JourneySegment, JourneySession } from "./types";
import type { MapCamera } from "./use-map-camera";

const CAMERA_SETTLE_MS = 350;

const toSegment = (
  record: JourneyRecord,
  route: JourneyRoute,
  target: JourneyPlace | null,
  from: JourneyPlace | null,
): JourneySegment => ({
  route,
  target,
  from: target ? (from ?? record.destination) : null,
  to: target ?? record.destination,
  key: Date.now() + Math.random(),
});

const toRouteError = (error: unknown) => ({
  error: error instanceof Error ? error.message : "경로를 불러오지 못했어요. 다시 시도해 주세요.",
  errorCode: error instanceof JourneyRouteError ? error.code : undefined,
});

const startSession = (
  record: JourneyRecord,
  region: JourneyRegion,
  queue: JourneyPlace[],
  replaying: boolean,
): JourneySession => ({
  record,
  region,
  segments: [],
  queue,
  active: null,
  status: "loading",
  error: "",
  current: null,
  replaying,
});

type RouteQuery = (
  record: JourneyRecord,
  region: JourneyRegion,
  target: JourneyPlace | null,
  from: JourneyPlace | null,
) => ReturnType<typeof journeyRouteQuery>;

type JourneySessionOptions = {
  routeQuery: RouteQuery;
  camera: Pick<MapCamera, "viewRef" | "setView" | "moveCamera" | "stop">;
  closeSheet: () => Promise<unknown>;
};

export const useJourneySession = ({ routeQuery, camera, closeSheet }: JourneySessionOptions) => {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<JourneySession | null>(null);
  const sessionRef = useRef<JourneySession | null>(null);
  const [highlight, setHighlight] = useState<{ place: JourneyPlace; key: number } | null>(null);
  const generation = useRef(0);
  const fastForward = useRef(false);
  const animationDone = useRef<(() => void) | null>(null);
  const sheetClosed = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(
    () => () => {
      generation.current++;
      sessionRef.current = null;
    },
    [],
  );

  const setSessionValue = (next: JourneySession | null) => {
    sessionRef.current = next;
    setSession(next);
  };

  const fetchLeg = (
    record: JourneyRecord,
    region: JourneyRegion,
    target: JourneyPlace | null,
    from: JourneyPlace | null,
  ) =>
    queryClient.fetchQuery(routeQuery(record, region, target, from)).then(
      (route) => ({ route }),
      (error: unknown) => ({ error }),
    );

  const waitForPlayback = (duration: number) =>
    new Promise<void>((resolve) => {
      animationDone.current = resolve;
      setTimeout(() => {
        if (animationDone.current === resolve) animationDone.current = null;
        resolve();
      }, duration);
    });

  const run = async (initial: JourneySession, token: number) => {
    let next = initial;
    while (token === generation.current) {
      const target = next.active;
      const result = await fetchLeg(next.record, next.region, target, next.current);
      if (token !== generation.current) return;
      if ("error" in result) {
        fastForward.current = false;
        setSessionValue({ ...sessionRef.current!, status: "error", ...toRouteError(result.error), replaying: false });
        return;
      }

      const route = result.route;
      const view = target ? followBox(camera.viewRef.current, route) : routeBox([route]);
      if (view && !fastForward.current) camera.moveCamera(view);
      setSessionValue({ ...sessionRef.current!, status: "moving" });
      await Promise.all([
        sheetClosed.current,
        view && !prefersReducedMotion() && !fastForward.current ? waitForPlayback(CAMERA_SETTLE_MS) : null,
      ]);
      if (token !== generation.current) return;

      const segment = toSegment(next.record, route, target, next.current);
      next = { ...sessionRef.current!, segments: [...sessionRef.current!.segments, segment], status: "drawing" };
      setSessionValue(next);
      if (!prefersReducedMotion() && !fastForward.current) await waitForPlayback(SKETCH_MS);
      if (token !== generation.current) return;

      next = { ...sessionRef.current!, current: target, active: null, status: "idle" };
      setSessionValue(next);
      if (!next.queue.length) {
        if (next.replaying) {
          setSessionValue({ ...next, replaying: false });
          if (fastForward.current) camera.moveCamera(routeBox(next.segments.map((item) => item.route)));
        }
        fastForward.current = false;
        return;
      }

      const [first, ...rest] = next.queue;
      next = { ...next, active: first, queue: rest, status: "loading" };
      setSessionValue(next);
    }
  };

  const begin = (record: JourneyRecord, region: JourneyRegion, queue: JourneyPlace[] = [], replaying = false) => {
    const token = ++generation.current;
    fastForward.current = false;
    animationDone.current?.();
    sheetClosed.current = closeSheet();

    const next = startSession(record, region, queue, replaying);
    setSessionValue(next);
    setHighlight(null);
    void run(next, token);
  };

  const restore = async (record: JourneyRecord, region: JourneyRegion, places: JourneyPlace[]) => {
    const token = ++generation.current;
    const base = startSession(record, region, [], false);
    setSessionValue(base);

    const segments: JourneySegment[] = [];
    let current: JourneyPlace | null = null;
    for (const [index, target] of [null, ...places].entries()) {
      const result = await fetchLeg(record, region, target, current);
      if (token !== generation.current) return;
      if ("error" in result) {
        setSessionValue({
          ...base,
          segments,
          current,
          active: target,
          queue: places.slice(index),
          status: "error",
          ...toRouteError(result.error),
        });
        return;
      }

      segments.push(toSegment(record, result.route, target, current));
      current = target;
    }

    camera.stop();
    camera.setView(routeBox(segments.map((segment) => segment.route)));
    setSessionValue({ ...base, segments, current, status: "idle", restored: true });
  };

  const completeSegments = session?.status === "drawing" ? session.segments.slice(0, -1) : (session?.segments ?? []);

  const focusPlace = (place: JourneyPlace) => {
    const point = project(place.longitude, place.latitude);
    const view = camera.viewRef.current;
    camera.moveCamera({ ...view, x: point.x - view.width / 2, y: point.y - view.height * 0.45 });
    setHighlight({ place, key: Date.now() });
  };

  const selectPlace = (place: JourneyPlace) => {
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

  const pressPlace = (place: JourneyPlace) => {
    const current = sessionRef.current;
    if (current?.status !== "idle" || current.segments.some((segment) => segment.target?.id === place.id)) return;

    void queryClient.prefetchQuery(routeQuery(current.record, current.region, place, current.current));
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

  const finishReplay = () => {
    if (!sessionRef.current?.replaying) return;

    fastForward.current = true;
    setSessionValue({ ...sessionRef.current, restored: true });
    animationDone.current?.();
  };

  const clear = () => {
    generation.current++;
    animationDone.current?.();
    fastForward.current = false;
    setSessionValue(null);
    setHighlight(null);
  };

  return {
    session,
    sessionRef,
    highlight,
    completeSegments,
    begin,
    restore,
    focusPlace,
    selectPlace,
    pressPlace,
    recover,
    finishReplay,
    clear,
  };
};
