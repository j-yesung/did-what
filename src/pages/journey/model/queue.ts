export type JourneyPlace = { id: string };
export type JourneyQueue<T extends JourneyPlace> = {
  current: T | null;
  active: T | null;
  queue: T[];
  segments: { target: T | null }[];
  status: "loading" | "drawing" | "idle" | "error";
};

/** A place is picked once: drawn, in-flight or queued places ignore further taps, so no leg or distance repeats. */
export const enqueueJourneyPlace = <T extends JourneyPlace, S extends JourneyQueue<T>>(state: S, place: T): S => {
  if (
    state.active?.id === place.id ||
    state.queue.some((queued) => queued.id === place.id) ||
    state.segments.some((segment) => segment.target?.id === place.id)
  )
    return state;
  if (state.status === "idle") return { ...state, active: place, status: "loading" };
  return { ...state, queue: [...state.queue, place] };
};

/** A skipped place never becomes the origin of the following leg. */
export const skipJourneyPlace = <T extends JourneyPlace, S extends JourneyQueue<T>>(state: S): S => {
  if (state.status !== "error" || !state.active) return state;
  const [first, ...rest] = state.queue;
  return { ...state, active: first ?? null, queue: rest, status: first ? "loading" : "idle" };
};
