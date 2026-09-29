import type { MapView } from "./use-map-viewport";

type MapUrlState = {
  region: string | null;
  subregion: string | null;
  view: MapView | null;
};

const REGION_PARAM = "region";
const SUBREGION_PARAM = "sub";
const VIEW_PARAM = "view";

// "배율,x,y". 되돌아왔을 때 같은 자리로 오면 충분해서 지도 단위 소수 첫째 자리까지만 남긴다.
export const parseMapView = (value: string | null | undefined): MapView | null => {
  const numbers = value?.split(",").map(Number);
  if (numbers?.length !== 3 || !numbers.every(Number.isFinite)) return null;

  const [zoom, x, y] = numbers;
  return zoom > 0 ? { zoom, x, y } : null;
};

const formatMapView = ({ x, y, zoom }: MapView) =>
  `${Number(zoom.toFixed(3))},${Number(x.toFixed(1))},${Number(y.toFixed(1))}`;

export const readMapUrlState = (params: Pick<URLSearchParams, "get"> | null): MapUrlState => {
  const region = params?.get(REGION_PARAM) || null;

  return {
    region,
    subregion: region ? params?.get(SUBREGION_PARAM) || null : null,
    view: parseMapView(params?.get(VIEW_PARAM)),
  };
};

// 지도가 쓰지 않는 다른 검색어는 그대로 둔다.
export const toMapSearch = (search: string, { region, subregion, view }: MapUrlState) => {
  const params = new URLSearchParams(search);
  const entries: [string, string | null][] = [
    [REGION_PARAM, region],
    [SUBREGION_PARAM, region ? subregion : null],
    [VIEW_PARAM, view ? formatMapView(view) : null],
  ];

  for (const [key, value] of entries) {
    if (value) params.set(key, value);
    else params.delete(key);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
};
