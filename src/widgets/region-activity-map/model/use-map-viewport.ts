import type { PointerEvent } from "react";
import { useRef, useState } from "react";

type MapSize = { width: number; height: number };
type MapView = { zoom: number; x: number; y: number };
type PointerPosition = { clientX: number; clientY: number };
type MapPosition = { x: number; y: number };
type PinchGesture = {
  anchor: MapPosition;
  inverseMatrix: DOMMatrix;
  startDistance: number;
  startView: MapView;
};

export const MAX_MAP_ZOOM = 4;
export const INITIAL_MAP_VIEW: MapView = { zoom: 1, x: 0, y: 0 };

const constrainMapView = (map: MapSize, next: MapView): MapView => ({
  ...next,
  x: Math.max(0, Math.min(map.width - map.width / next.zoom, next.x)),
  y: Math.max(0, Math.min(map.height - map.height / next.zoom, next.y)),
});

export const focusMapView = (map: MapSize, position: { x: number; y: number }) =>
  constrainMapView(map, {
    zoom: MAX_MAP_ZOOM,
    x: position.x - map.width / MAX_MAP_ZOOM / 2,
    y: position.y - map.height / MAX_MAP_ZOOM / 2,
  });

export const pinchMapView = (
  map: MapSize,
  startView: MapView,
  anchor: MapPosition,
  currentCenter: MapPosition,
  scale: number,
) => {
  const zoom = Math.max(1, Math.min(MAX_MAP_ZOOM, startView.zoom * scale));
  const centerRatioX = (currentCenter.x - startView.x) / (map.width / startView.zoom);
  const centerRatioY = (currentCenter.y - startView.y) / (map.height / startView.zoom);

  return constrainMapView(map, {
    zoom,
    x: anchor.x - centerRatioX * (map.width / zoom),
    y: anchor.y - centerRatioY * (map.height / zoom),
  });
};

const getCenter = ([first, second]: PointerPosition[]): PointerPosition => ({
  clientX: (first.clientX + second.clientX) / 2,
  clientY: (first.clientY + second.clientY) / 2,
});

const getDistance = ([first, second]: PointerPosition[]) =>
  Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);

const toMapPosition = (point: PointerPosition, matrix: DOMMatrix): MapPosition => {
  const position = new DOMPoint(point.clientX, point.clientY).matrixTransform(matrix);
  return { x: position.x, y: position.y };
};

export const useMapViewport = (map: MapSize) => {
  const [view, setView] = useState(INITIAL_MAP_VIEW);
  const viewRef = useRef(view);
  const drag = useRef<{ pointerId: number; clientX: number; clientY: number } | null>(null);
  const pinch = useRef<PinchGesture | null>(null);
  const pointers = useRef(new Map<number, PointerPosition>());
  const width = map.width / view.zoom;
  const height = map.height / view.zoom;

  // 포인터 처리기는 다음 렌더를 기다리지 않고 방금 바꾼 시점을 읽어야 해서 ref도 함께 바꾼다.
  const commit = (next: MapView) => {
    viewRef.current = next;
    setView(next);
  };

  const focusOn = (position: MapPosition) => commit(focusMapView(map, position));

  const onPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (pointers.current.size >= 2) return;
    pointers.current.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });
    event.currentTarget.setPointerCapture(event.pointerId);

    if (pointers.current.size >= 2) {
      const points = [...pointers.current.values()].slice(0, 2);
      const matrix = event.currentTarget.getScreenCTM();
      if (!matrix) return;
      const center = getCenter(points);
      const startDistance = getDistance(points);
      if (startDistance === 0) return;
      const inverseMatrix = matrix.inverse();
      pinch.current = {
        anchor: toMapPosition(center, inverseMatrix),
        inverseMatrix,
        startDistance,
        startView: viewRef.current,
      };
      drag.current = null;
      return;
    }

    drag.current = { pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY };
  };

  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });

    if (pointers.current.size >= 2 && pinch.current) {
      const points = [...pointers.current.values()].slice(0, 2);
      commit(
        pinchMapView(
          map,
          pinch.current.startView,
          pinch.current.anchor,
          toMapPosition(getCenter(points), pinch.current.inverseMatrix),
          getDistance(points) / pinch.current.startDistance,
        ),
      );
      return;
    }

    const previous = drag.current;
    if (!previous || previous.pointerId !== event.pointerId) return;
    const matrix = event.currentTarget.getScreenCTM();
    if (!matrix) return;
    const dx = (event.clientX - previous.clientX) / matrix.a;
    const dy = (event.clientY - previous.clientY) / matrix.d;
    drag.current = { pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY };
    const current = viewRef.current;
    commit(constrainMapView(map, { ...current, x: current.x - dx, y: current.y - dy }));
  };

  const endPointer = (event: PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(event.pointerId);
    pinch.current = null;

    const remainingPointer = pointers.current.entries().next().value as [number, PointerPosition] | undefined;
    drag.current = remainingPointer ? { pointerId: remainingPointer[0], ...remainingPointer[1] } : null;
  };

  const reset = () => commit(INITIAL_MAP_VIEW);

  return {
    zoom: view.zoom,
    canZoomOut: view.zoom > 1,
    reset,
    focusOn,
    svgProps: {
      viewBox: `${view.x} ${view.y} ${width} ${height}`,
      onPointerDown,
      onPointerMove,
      onPointerUp: endPointer,
      onPointerCancel: endPointer,
      onLostPointerCapture: endPointer,
    },
  };
};
