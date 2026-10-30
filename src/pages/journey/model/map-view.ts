import type { JourneyRoute as Route } from "./types";

export type Box = { x: number; y: number; width: number; height: number };

export const project = (longitude: number, latitude: number) => ({
  x: 110 + (longitude - 125.5) * 49 * Math.cos((36 * Math.PI) / 180),
  y: 23 + (39.4 - latitude) * 49,
});

const homeTopLeft = project(125.5, 39.4);
const homeBottomRight = project(130.2, 32.4);

export const national: Box = {
  x: homeTopLeft.x,
  y: homeTopLeft.y,
  width: homeBottomRight.x - homeTopLeft.x,
  height: homeBottomRight.y - homeTopLeft.y,
};

export const pinAt = (point: { x: number; y: number }) => ({ transformOrigin: `${point.x}px ${point.y}px` });

export const MIN_VIEW_WIDTH = 0.02;
export const MAX_VIEW_WIDTH = 400;
const MIN_ROUTE_WIDTH = 3;

export const clampViewWidth = (width: number) => Math.max(MIN_VIEW_WIDTH, Math.min(MAX_VIEW_WIDTH, width));

export const viewScale = (view: Box, viewport: { width: number; height: number }) =>
  Math.max(view.width / viewport.width, view.height / viewport.height);

export const toViewPoint = (view: Box, rect: DOMRectReadOnly, clientX: number, clientY: number) => {
  const scale = viewScale(view, rect);
  return {
    x: view.x + view.width / 2 + (clientX - rect.left - rect.width / 2) * scale,
    y: view.y + view.height / 2 + (clientY - rect.top - rect.height / 2) * scale,
  };
};

export const expandView = (view: Box, factor: number): Box => ({
  x: view.x - (view.width * (factor - 1)) / 2,
  y: view.y - (view.height * (factor - 1)) / 2,
  width: view.width * factor,
  height: view.height * factor,
});

export const viewTransform = (rendered: Box, live: Box, viewport: { width: number; height: number }) => {
  const renderedScale = viewScale(rendered, viewport);
  const liveScale = viewScale(live, viewport);

  return {
    scale: renderedScale / liveScale,
    x: (rendered.x + rendered.width / 2 - (live.x + live.width / 2)) / liveScale,
    y: (rendered.y + rendered.height / 2 - (live.y + live.height / 2)) / liveScale,
  };
};

const routeBounds = (routes: Route[]) => {
  let x = Infinity;
  let y = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
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

export type Frame = { width: number; height: number; top: number; bottom: number };

const routeArea = (frame: Frame) => {
  const top = Math.min(frame.top, frame.height * 0.5) + 40;
  const bottom = Math.max(top + frame.height * 0.25, frame.height - frame.bottom - 20);

  return { top, bottom };
};

const toViewY = (view: Box, frame: Frame, y: number) =>
  view.y + view.height / 2 + (y - frame.height / 2) * viewScale(view, frame);

export const routeBox = (routes: Route[], frame?: Frame): Box => {
  const bounds = routeBounds(routes);
  if (!bounds) return national;

  const { x, y, maxX, maxY } = bounds;
  const width = Math.max(0.5, maxX - x);
  const height = Math.max(0.75, maxY - y);
  if (frame) {
    const area = routeArea(frame);
    const scale = Math.max(
      (width * 1.8) / frame.width,
      height / (area.bottom - area.top),
      MIN_ROUTE_WIDTH / frame.width,
    );

    return {
      x: (x + maxX) / 2 - (frame.width * scale) / 2,
      y: (y + maxY) / 2 - ((area.top + area.bottom) / 2) * scale,
      width: frame.width * scale,
      height: frame.height * scale,
    };
  }

  const paddedWidth = Math.max(width * 1.8, height * 0.75, MIN_ROUTE_WIDTH);
  const paddedHeight = Math.max(height * 2.3, width * 1.2, 1.4);

  return {
    x: (x + maxX) / 2 - paddedWidth / 2,
    y: (y + maxY) / 2 - paddedHeight * 0.5,
    width: paddedWidth,
    height: paddedHeight,
  };
};

export const followBox = (view: Box, route: Route, frame?: Frame): Box | null => {
  const bounds = routeBounds([route]);
  if (!bounds) return null;

  const fit = routeBox([route], frame);
  const left = view.x + view.width * 0.1;
  const right = view.x + view.width * 0.9;
  const area = frame && routeArea(frame);
  const top = area ? toViewY(view, frame, area.top) : view.y + view.height * 0.2;
  const bottom = area ? toViewY(view, frame, area.bottom) : view.y + view.height * 0.7;
  const visible = bounds.x >= left && bounds.maxX <= right && bounds.y >= top && bounds.maxY <= bottom;

  return visible && fit.width >= view.width * 0.3 ? null : fit;
};

type Point = { x: number; y: number };

export const toPathData = (points: Point[]) =>
  points.map((point, index) => `${index ? "L" : "M"}${point.x},${point.y}`).join("");

export const pathLengths = (points: Point[]) =>
  points.reduce<number[]>(
    (lengths, point, index) =>
      index
        ? [...lengths, lengths[index - 1] + Math.hypot(point.x - points[index - 1].x, point.y - points[index - 1].y)]
        : [0],
    [],
  );

export const partialPathData = (points: Point[], lengths: number[], length: number) => {
  let end = 1;
  while (end < points.length && lengths[end] <= length) end++;
  if (end >= points.length) return toPathData(points);

  const from = points[end - 1];
  const to = points[end];
  const ratio = (length - lengths[end - 1]) / (lengths[end] - lengths[end - 1] || 1);

  return toPathData([
    ...points.slice(0, end),
    { x: from.x + (to.x - from.x) * ratio, y: from.y + (to.y - from.y) * ratio },
  ]);
};

const worldStart = project(124.5, 39.4);
const worldEnd = project(132.3, 32.4);

export const constrainView = (view: Box): Box => ({
  ...view,
  x: Math.max(worldStart.x - view.width * 0.8, Math.min(worldEnd.x - view.width * 0.2, view.x)),
  y: Math.max(worldStart.y - view.height * 0.8, Math.min(worldEnd.y - view.height * 0.2, view.y)),
});

export const MOMENTUM_MS = 90;

export const momentumView = (start: Box, velocity: { x: number; y: number }, elapsed: number) => {
  const distance = MOMENTUM_MS * (1 - Math.exp(-Math.max(0, elapsed) / MOMENTUM_MS));
  return constrainView({ ...start, x: start.x - velocity.x * distance, y: start.y - velocity.y * distance });
};
