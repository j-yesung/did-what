"use client";

import { useRef, useState } from "react";

import type { JourneyRegion, JourneySheetKind } from "./types";

const CLOSE_FALLBACK_MS = 700;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const useJourneySheet = (keepOpener: boolean) => {
  const [kind, setKind] = useState<JourneySheetKind | null>(null);
  const [content, setContent] = useState(kind);
  if (kind !== null && kind !== content) setContent(kind);
  const [choices, setChoices] = useState<JourneyRegion[]>([]);
  const opener = useRef<Element | null>(null);
  const resolveClosed = useRef<(() => void) | null>(null);

  const show = (next: JourneySheetKind | null) => {
    if (next !== null && kind === null && !keepOpener) opener.current = document.activeElement;
    setKind(next);
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

  const showChoices = (regions: JourneyRegion[]) => {
    setChoices(regions);
    show("choices");
  };

  return {
    kind,
    content,
    choices,
    opener,
    show,
    close,
    handleCloseComplete,
    showChoices,
  };
};
