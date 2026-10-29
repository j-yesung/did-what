import type { JourneyPlace, JourneyRoute as Route } from "./types";

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

export const MIN_VIEW_WIDTH = 0.02;
export const MAX_VIEW_WIDTH = 400;

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
    const scale = Math.max((width * 1.8) / frame.width, height / (area.bottom - area.top), 0.9 / frame.width);

    return {
      x: (x + maxX) / 2 - (frame.width * scale) / 2,
      y: (y + maxY) / 2 - ((area.top + area.bottom) / 2) * scale,
      width: frame.width * scale,
      height: frame.height * scale,
    };
  }

  const paddedWidth = Math.max(width * 1.8, height * 0.75, 0.9);
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

const nameWidth = (name: string) => [...name].reduce((width, char) => width + (char.charCodeAt(0) > 255 ? 11 : 6.5), 0);

export const placeLabels = (places: readonly JourneyPlace[], view: Box, unit: number, viewportWidth: number) => {
  const left = view.x + view.width / 2 - (viewportWidth * unit) / 2 + 12 * unit;
  const right = left + (viewportWidth - 24) * unit;
  const unique = [...new Map(places.map((place) => [place.id, place])).values()].filter((place) => {
    const point = project(place.longitude, place.latitude);

    return (
      point.x >= left - 12 * unit &&
      point.x <= right + 12 * unit &&
      point.y >= view.y &&
      point.y <= view.y + view.height
    );
  });

  const layout = (group: JourneyPlace[]) => {
    const place = group[0];
    const point = project(place.longitude, place.latitude);
    const suffix = group.length > 1 ? ` +${group.length - 1}` : "";
    const maxWidth = Math.max(44, (right - left) / unit - 20);

    let name = place.name;
    while (name.length > 1 && nameWidth(name + suffix) > maxWidth) name = name.slice(0, -1);

    if (name !== place.name) name = `${name.slice(0, -1)}…`;

    const width = Math.max(44, nameWidth(name + suffix) + 20) * unit;
    const x = Math.max(left, Math.min(right - width, point.x + 7 * unit));
    const y = point.y - 38 * unit;

    return { key: place.id, x, y, width, name, places: group };
  };

  let groups = unique.map((place) => [place]);
  let merged = true;

  while (merged) {
    merged = false;
    for (let i = 0; i < groups.length && !merged; i++) {
      const a = layout(groups[i]);
      for (let j = i + 1; j < groups.length; j++) {
        const b = layout(groups[j]);
        if (a.x < b.x + b.width + 6 * unit && b.x < a.x + a.width + 6 * unit && Math.abs(a.y - b.y) < 36 * unit) {
          groups[i] = [...groups[i], ...groups[j]];
          groups = groups.filter((_, index) => index !== j);
          merged = true;
          break;
        }
      }
    }
  }

  return groups.map(layout);
};

export const placesBox = (places: readonly JourneyPlace[], viewport: { width: number; height: number }): Box => {
  if (!places.length) return national;

  const points = places.map((place) => project(place.longitude, place.latitude));
  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  const width = Math.max(0.02, (maxX - minX) * 3, (((maxY - minY) * viewport.width) / viewport.height) * 3);
  const height = (width * viewport.height) / viewport.width;

  return { x: (minX + maxX - width) / 2, y: (minY + maxY) / 2 - height * 0.45, width, height };
};

const worldStart = project(124.5, 39.4);
const worldEnd = project(132.3, 32.4);

export const constrainView = (view: Box): Box => ({
  ...view,
  x: Math.max(worldStart.x - view.width * 0.8, Math.min(worldEnd.x - view.width * 0.2, view.x)),
  y: Math.max(worldStart.y - view.height * 0.8, Math.min(worldEnd.y - view.height * 0.2, view.y)),
});

export const momentumView = (start: Box, velocity: { x: number; y: number }, elapsed: number) => {
  const distance = 180 * (1 - Math.exp(-Math.max(0, elapsed) / 180));
  return constrainView({ ...start, x: start.x - velocity.x * distance, y: start.y - velocity.y * distance });
};
