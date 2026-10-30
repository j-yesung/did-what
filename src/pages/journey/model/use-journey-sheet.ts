"use client";

import { useEffect, useRef, useState } from "react";

import { SHEET_EXPAND_MS, useCompactSnapPoint } from "@/shared/ui/use-compact-snap-point";

import type { JourneyRegion, JourneySheetKind } from "./types";

const CLOSE_FALLBACK_MS = 700;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const useJourneySheet = (keepOpener: boolean) => {
  const [kind, setKind] = useState<JourneySheetKind | null>(null);
  const [content, setContent] = useState(kind);
  if (kind !== null && kind !== content) setContent(kind);
  const [choices, setChoices] = useState<JourneyRegion[]>([]);
  const opener = useRef<Element | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolveClosed = useRef<(() => void) | null>(null);
  const snap = useCompactSnapPoint(kind === "regions" || kind === "choices");

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const show = (next: JourneySheetKind | null) => {
    if (next !== null && kind === null && !keepOpener) opener.current = document.activeElement;
    clearTimer();
    setKind(next);
    if (next !== null) snap.setSnapPoint(next === "records" ? 1 : snap.compactHeightRef.current);
  };

  const close = (): Promise<unknown> => {
    const closed =
      kind === null
        ? Promise.resolve()
        : Promise.race([
            new Promise<void>((resolve) => {
              resolveClosed.current = resolve;
            }),
            sleep(CLOSE_FALLBACK_MS),
          ]);
    show(null);
    return closed;
  };

  const handleCloseComplete = () => {
    resolveClosed.current?.();
    resolveClosed.current = null;
  };

  const expandTo = (next: JourneySheetKind, prepare: () => void) => {
    snap.setSnapPoint(1);
    clearTimer();
    timer.current = setTimeout(() => {
      timer.current = null;
      prepare();
      setKind(next);
    }, SHEET_EXPAND_MS);
  };

  const showChoices = (regions: JourneyRegion[]) => {
    setChoices(regions);
    show("choices");
  };

  return {
    kind,
    content,
    choices,
    opener,
    snap,
    show,
    close,
    handleCloseComplete,
    expandTo,
    showChoices,
  };
};
