import { queryOptions } from "@tanstack/react-query";

import type { JourneyRecord } from "../model/record";
import type { JourneyPlace, JourneyRegion, JourneyRoute } from "../model/types";

const ROUTE_ERROR = "경로를 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.";

export class JourneyRouteError extends Error {
  constructor(
    message = ROUTE_ERROR,
    public readonly code?: string,
  ) {
    super(message);
  }
}

export const legParams = (
  record: Pick<JourneyRecord, "id">,
  region: Pick<JourneyRegion, "code">,
  target: JourneyPlace | null,
  from: JourneyPlace | null,
) => {
  const params = new URLSearchParams({ recordId: record.id, region: region.code });
  if (target) {
    params.set("placeId", target.id);
    if (from) params.set("fromPlaceId", from.id);
  }
  return params;
};

const fetchRoute = async (params: URLSearchParams, signal: AbortSignal): Promise<JourneyRoute> => {
  const response = await fetch(`/journey/directions?${params}`, { signal, cache: "no-store" }).catch(() => null);
  const body: { route?: JourneyRoute; error?: string; code?: string } | null = response
    ? await response.json().catch(() => null)
    : null;
  if (response?.ok && body?.route) return body.route;
  throw new JourneyRouteError(body?.error, body?.code);
};

export const journeyRouteQuery = (
  memberId: string,
  homeVersion: string | null,
  record: JourneyRecord,
  region: JourneyRegion,
  target: JourneyPlace | null,
  from: JourneyPlace | null,
) => {
  const params = legParams(record, region, target, from);
  const end = target ?? record.destination;
  const start = from ?? (target ? record.destination : null);
  return queryOptions({
    queryKey: [
      "journey-route",
      memberId,
      params.toString(),
      start ? `${start.longitude},${start.latitude}` : homeVersion,
      `${end.longitude},${end.latitude}`,
    ],
    queryFn: ({ signal }) => fetchRoute(params, signal),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
    retry: false,
  });
};
