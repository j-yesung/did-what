import type { JourneyStatus } from "./types";

type QueuePlace = { id: string };

export type JourneyQueue<T extends QueuePlace> = {
  current: T | null;
  active: T | null;
  queue: T[];
  segments: { target: T | null }[];
  status: JourneyStatus;
};

export const pickedJourneyPlaces = <T extends QueuePlace>(state: JourneyQueue<T>): T[] => [
  ...new Map(
    [
      ...state.segments.flatMap(({ target }) => (target ? [target] : [])),
      ...(state.active ? [state.active] : []),
      ...state.queue,
    ].map((place) => [place.id, place]),
  ).values(),
];

export const enqueueJourneyPlace = <T extends QueuePlace, S extends JourneyQueue<T>>(state: S, place: T): S => {
  if (
    state.active?.id === place.id ||
    state.queue.some((queued) => queued.id === place.id) ||
    state.segments.some((segment) => segment.target?.id === place.id)
  )
    return state;

  if (state.status === "idle") return { ...state, active: place, status: "loading" };
  return { ...state, queue: [...state.queue, place] };
};

export const skipJourneyPlace = <T extends QueuePlace, S extends JourneyQueue<T>>(state: S): S => {
  if (state.status !== "error" || !state.active) return state;

  const [first, ...rest] = state.queue;
  return { ...state, active: first ?? null, queue: rest, status: first ? "loading" : "idle" };
};
