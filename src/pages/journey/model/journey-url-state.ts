type JourneyUrlState = {
  region: string | null;
  subregion: string | null;
  record: string | null;
  places: string[];
  detail: string | null;
};

const JOURNEY_PARAMS = ["region", "sub", "record", "places", "detail", "view", "period"];

export const readJourneyUrlState = (params: Pick<URLSearchParams, "get"> | null): JourneyUrlState => {
  const region = params?.get("region") ?? null;

  return {
    region,
    subregion: (region && params?.get("sub")) || null,
    record: params?.get("record") ?? null,
    places: params?.get("places")?.split(",") ?? [],
    detail: (region && params?.get("detail")) || null,
  };
};

export const toJourneySearch = (search: string, state: JourneyUrlState | null) => {
  const params = new URLSearchParams(search);
  for (const key of JOURNEY_PARAMS) params.delete(key);

  if (state?.region) {
    params.set("region", state.region);
    if (state.subregion) params.set("sub", state.subregion);
    if (state.record) params.set("record", state.record);
    if (state.record && state.places.length) params.set("places", state.places.join(","));
    if (state.detail) params.set("detail", state.detail);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
};
