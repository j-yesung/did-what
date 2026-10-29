"use client";

import { useLayoutEffect, useRef, useState } from "react";

export const SHEET_EXPAND_MS = 250;
export const SHEET_HANDLE_HEIGHT = 29;

export const useCompactSnapPoint = (measureContent: boolean) => {
  const [header, setHeader] = useState<HTMLElement | null>(null);
  const [body, setBody] = useState<HTMLElement | null>(null);
  const compactHeightRef = useRef(360);
  const [compactHeight, setCompactHeight] = useState(360);
  const [snapPoint, setSnapPoint] = useState<number | string | null>(360);

  useLayoutEffect(() => {
    if (!measureContent || !header || !body) return;
    const measure = () => {
      const height = Math.ceil(header.offsetHeight + body.offsetHeight + SHEET_HANDLE_HEIGHT);
      if (height === compactHeightRef.current) return;
      const previous = compactHeightRef.current;
      compactHeightRef.current = height;
      setCompactHeight(height);
      setSnapPoint((current) => (current === previous ? height : current));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    observer.observe(body);
    return () => observer.disconnect();
  }, [measureContent, header, body]);

  return { compactHeight, compactHeightRef, snapPoint, setSnapPoint, setHeader, setBody };
};
