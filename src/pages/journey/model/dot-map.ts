import type { Box } from "./map-view";

export type Shape = { points: number[]; left: number; top: number; right: number; bottom: number };

export const LIT_LEVELS = 4;

const BASE_STEP = 5.6;
const MIN_GAP = 11;

export const toShape = (points: number[]): Shape => {
  const xs = points.filter((_, index) => index % 2 === 0);
  const ys = points.filter((_, index) => index % 2 === 1);

  return { points, left: Math.min(...xs), top: Math.min(...ys), right: Math.max(...xs), bottom: Math.max(...ys) };
};

const crossings = ({ points }: Shape, y: number) => {
  const xs: number[] = [];
  for (let i = 0, j = points.length - 2; i < points.length; j = i, i += 2) {
    const yi = points[i + 1];
    const yj = points[j + 1];
    if (yi > y !== yj > y) xs.push(((points[j] - points[i]) * (y - yi)) / (yj - yi) + points[i]);
  }

  return xs.sort((a, b) => a - b);
};

const within = (xs: number[], x: number) => {
  let hit = false;
  for (const crossing of xs) {
    if (crossing > x) break;
    hit = !hit;
  }

  return hit;
};

export const dotStep = (unit: number) =>
  BASE_STEP / 2 ** Math.max(0, Math.floor(Math.log2(BASE_STEP / (MIN_GAP * unit))));

export type Spot = { x: number; y: number; weight: number };

export const spotRadius = (step: number) => step * 0.75;

const shine = (spots: Spot[], radius: number, x: number, y: number) => {
  let total = 0;
  for (const spot of spots) {
    const distance = (spot.x - x) ** 2 + (spot.y - y) ** 2;
    if (distance <= radius ** 2) total += spot.weight * Math.exp(-distance / radius ** 2);
  }

  return Math.min(1, total);
};

export const landDots = (land: Shape[], spots: Spot[], box: Box, step: number) => {
  const dots: { x: number; y: number; level: number }[] = [];
  const radius = spotRadius(step);
  const nearby = spots.filter(
    ({ x, y }) =>
      x > box.x - radius && x < box.x + box.width + radius && y > box.y - radius && y < box.y + box.height + radius,
  );
  const add = (x: number, y: number) => {
    const light = shine(nearby, radius, x, y);
    dots.push({ x, y, level: light > 0 ? Math.min(LIT_LEVELS - 1, Math.floor(light * LIT_LEVELS)) : -1 });
  };

  for (const shape of land) {
    const left = Math.max(box.x, shape.left);
    const right = Math.min(box.x + box.width, shape.right);
    const top = Math.max(box.y, shape.top);
    const bottom = Math.min(box.y + box.height, shape.bottom);
    if (left > right || top > bottom) continue;

    const before = dots.length;
    for (let row = Math.ceil(top / step); row * step <= bottom; row++) {
      const edges = crossings(shape, row * step);
      for (let column = Math.ceil(left / step); column * step <= right; column++) {
        if (within(edges, column * step)) add(column * step, row * step);
      }
    }

    const x = (shape.left + shape.right) / 2;
    const y = (shape.top + shape.bottom) / 2;
    if (
      dots.length === before &&
      shape.right - shape.left < step * 2 &&
      x >= left &&
      x <= right &&
      y >= top &&
      y <= bottom
    )
      add(x, y);
  }

  return dots;
};

export const circlesPath = (centers: { x: number; y: number }[], radius: number) => {
  const digits = Math.max(1, Math.ceil(-Math.log10(radius)) + 2);
  const r = radius.toFixed(digits);
  const d = (radius * 2).toFixed(digits);

  return centers
    .map(
      ({ x, y }) =>
        `M${(x - radius).toFixed(digits)} ${y.toFixed(digits)}a${r} ${r} 0 1 0 ${d} 0a${r} ${r} 0 1 0 -${d} 0`,
    )
    .join("");
};
