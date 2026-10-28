export type JourneyPlace = { id: string };
export type JourneyQueue<T extends JourneyPlace> = {
  current: T | null;
  active: T | null;
  queue: T[];
  status: "loading" | "drawing" | "idle" | "error";
};

/** Consecutive duplicate clicks do not add a zero-length leg; revisiting an older place remains possible. */
export const enqueueJourneyPlace = <T extends JourneyPlace, S extends JourneyQueue<T>>(state: S, place: T): S => {
  const last = state.queue.at(-1) ?? state.active ?? state.current;
  if (last?.id === place.id) return state;
  if (state.status === "idle") return { ...state, active: place, status: "loading" };
  return { ...state, queue: [...state.queue, place] };
};

/** A skipped place never becomes the origin of the following leg. */
export const skipJourneyPlace = <T extends JourneyPlace, S extends JourneyQueue<T>>(state: S): S => {
  if (state.status !== "error" || !state.active) return state;
  const [first, ...rest] = state.queue;
  return { ...state, active: first ?? null, queue: rest, status: first ? "loading" : "idle" };
};
