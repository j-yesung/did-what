type JourneyUrlState = {
  region: string | null;
  record: string | null;
  places: string[];
  detail: boolean;
};

const JOURNEY_PARAMS = ["region", "record", "places", "detail"];

export const readJourneyUrlState = (
  params: Pick<URLSearchParams, "get"> | null,
  traversal: boolean,
): JourneyUrlState => ({
  region: traversal ? (params?.get("region") ?? null) : null,
  record: params?.get("record") ?? null,
  places: params?.get("places")?.split(",") ?? [],
  detail: params?.get("detail") === "1",
});

export const toJourneySearch = (search: string, state: JourneyUrlState | null) => {
  const params = new URLSearchParams(search);
  for (const key of JOURNEY_PARAMS) params.delete(key);

  if (state?.region && state.record) {
    params.set("region", state.region);
    params.set("record", state.record);
    if (state.places.length) params.set("places", state.places.join(","));
    if (state.detail) params.set("detail", "1");
  }

  const query = params.toString();
  return query ? `?${query}` : "";
};
