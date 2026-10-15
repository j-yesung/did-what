type MapUrlState = {
  region: string | null;
  subregion: string | null;
};

const REGION_PARAM = "region";
const SUBREGION_PARAM = "sub";
const VIEW_PARAM = "view";

export const readMapUrlState = (params: Pick<URLSearchParams, "get"> | null): MapUrlState => {
  const region = params?.get(REGION_PARAM) || null;

  return {
    region,
    subregion: region ? params?.get(SUBREGION_PARAM) || null : null,
  };
};

// 지도가 쓰지 않는 다른 검색어는 그대로 둔다.
export const toMapSearch = (search: string, { region, subregion }: MapUrlState) => {
  const params = new URLSearchParams(search);
  params.delete("period");
  params.delete(VIEW_PARAM);
  const entries: [string, string | null][] = [
    [REGION_PARAM, region],
    [SUBREGION_PARAM, region ? subregion : null],
  ];

  for (const [key, value] of entries) {
    if (value) params.set(key, value);
    else params.delete(key);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
};
