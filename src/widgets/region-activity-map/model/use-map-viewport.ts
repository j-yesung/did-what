import type { PointerEvent } from "react";
import { useRef, useState } from "react";

type MapSize = { width: number; height: number };
type MapFrame = MapSize & { x: number; y: number };
export type MapView = { zoom: number; x: number; y: number };
type MapSpace = MapSize & { aspect: number; maxZoom: number };
type PointerPosition = { clientX: number; clientY: number };
type MapPosition = { x: number; y: number };
type PinchGesture = {
  anchor: MapPosition;
  inverseMatrix: DOMMatrix;
  startDistance: number;
  startView: MapView;
};

// 배율은 지도 전체 폭 기준이다. 1이면 섬까지 전부 보이고, 첫 화면은 틀 폭에 맞춘 배율에서 시작한다.
const MAX_ZOOM_FROM_HOME = 4;

/**
 * 배지처럼 화면 픽셀로 크기를 정하는 것의 환산 기준. 첫 화면 틀이 이 높이(iPhone 15의 지도 칸)에 꽉 찬다고 본다.
 * 실제 화면을 재면 서버에서 그린 첫 화면 뒤에 값이 바뀌어 배지가 늦게 뜨거나 움직인다.
 * 재지 않고 정해 두면 첫 화면부터 그대로이고, 기기마다 지도와 같은 비율로 조금 커지거나 작아진다.
 */
const REFERENCE_VIEW_HEIGHT = 620;

/**
 * 보이는 영역은 언제나 첫 화면 틀과 같은 비율이다. 세로로 긴 틀이면 세로 화면을 위아래까지 채운다.
 * 확대 한도는 첫 화면 기준으로 잡아 틀 크기가 달라도 같은 만큼 확대된다.
 */
export const getMapSpace = (map: MapSize, frame: MapSize): MapSpace => ({
  ...map,
  aspect: frame.height / frame.width,
  maxZoom: (map.width / frame.width) * MAX_ZOOM_FROM_HOME,
});

const getViewSize = (space: MapSpace, zoom: number): MapSize => ({
  width: space.width / zoom,
  height: (space.width / zoom) * space.aspect,
});

// 지도보다 넓게 보는 축은 가운데에 두고, 좁게 보는 축만 지도 밖으로 나가지 않게 한다.
const constrainAxis = (value: number, viewSize: number, mapSize: number) =>
  viewSize >= mapSize ? (mapSize - viewSize) / 2 : Math.max(0, Math.min(mapSize - viewSize, value));

const constrainMapView = (space: MapSpace, next: MapView): MapView => {
  const view = getViewSize(space, next.zoom);
  return {
    zoom: next.zoom,
    x: constrainAxis(next.x, view.width, space.width),
    y: constrainAxis(next.y, view.height, space.height),
  };
};

export const getHomeMapView = (space: MapSpace, frame: MapFrame) =>
  constrainMapView(space, { zoom: space.width / frame.width, x: frame.x, y: frame.y });

export const focusMapView = (space: MapSpace, position: MapPosition) => {
  const view = getViewSize(space, space.maxZoom);
  return constrainMapView(space, {
    zoom: space.maxZoom,
    x: position.x - view.width / 2,
    y: position.y - view.height / 2,
  });
};

export const pinchMapView = (
  space: MapSpace,
  startView: MapView,
  anchor: MapPosition,
  currentCenter: MapPosition,
  scale: number,
) => {
  const zoom = Math.max(1, Math.min(space.maxZoom, startView.zoom * scale));
  const start = getViewSize(space, startView.zoom);
  const next = getViewSize(space, zoom);

  return constrainMapView(space, {
    zoom,
    x: anchor.x - ((currentCenter.x - startView.x) / start.width) * next.width,
    y: anchor.y - ((currentCenter.y - startView.y) / start.height) * next.height,
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

// initialView는 주소에 남겨 둔 지난 화면이다. 배율과 위치가 지도 밖이면 안으로 들인다.
export const useMapViewport = (map: MapSize, frame: MapFrame, initialView?: MapView | null) => {
  const space = getMapSpace(map, frame);
  const home = getHomeMapView(space, frame);
  // null은 첫 화면이다. 화면 크기나 틀이 바뀌어도 첫 화면은 새 틀을 따라간다.
  const [view, setView] = useState<MapView | null>(() =>
    initialView
      ? constrainMapView(space, { ...initialView, zoom: Math.max(1, Math.min(space.maxZoom, initialView.zoom)) })
      : null,
  );
  const viewRef = useRef(view);
  const drag = useRef<{ pointerId: number; clientX: number; clientY: number } | null>(null);
  const pinch = useRef<PinchGesture | null>(null);
  const pointers = useRef(new Map<number, PointerPosition>());
  const current = view ?? home;
  const { width, height } = getViewSize(space, current.zoom);

  // 확대한 만큼 나눠 배지가 확대해도 같은 크기로 보이게 한다.
  const unitsPerPixel = (frame.height / REFERENCE_VIEW_HEIGHT) * (home.zoom / current.zoom);

  // 포인터 처리기는 다음 렌더를 기다리지 않고 방금 바꾼 시점을 읽어야 해서 ref도 함께 바꾼다.
  const commit = (next: MapView | null) => {
    viewRef.current = next;
    setView(next);
  };

  const focusOn = (position: MapPosition) => commit(focusMapView(space, position));

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
        startView: viewRef.current ?? home,
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
          space,
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
    const latest = viewRef.current ?? home;
    // 움직여도 제자리인 첫 화면은 그대로 둬야 복귀 버튼이 켜지지 않는다.
    const next = constrainMapView(space, { ...latest, x: latest.x - dx, y: latest.y - dy });
    if (next.x !== latest.x || next.y !== latest.y) commit(next);
  };

  const endPointer = (event: PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(event.pointerId);
    pinch.current = null;

    const remainingPointer = pointers.current.entries().next().value as [number, PointerPosition] | undefined;
    drag.current = remainingPointer ? { pointerId: remainingPointer[0], ...remainingPointer[1] } : null;
  };

  const reset = () => commit(null);

  return {
    zoom: current.zoom,
    homeZoom: home.zoom,
    unitsPerPixel,
    canReset: view !== null,
    view,
    reset,
    focusOn,
    svgProps: {
      viewBox: `${current.x} ${current.y} ${width} ${height}`,
      onPointerDown,
      onPointerMove,
      onPointerUp: endPointer,
      onPointerCancel: endPointer,
      onLostPointerCapture: endPointer,
    },
  };
};
