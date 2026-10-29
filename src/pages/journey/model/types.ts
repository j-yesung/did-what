export type JourneyPoint = { latitude: number; longitude: number };
export type JourneyPlace = JourneyPoint & { id: string; name: string };
export type JourneyRegion = JourneyPoint & { code: string; name: string; count: number };
export type JourneyRoute = { points: [number, number][]; distance: number; duration: number; straight?: boolean };
export type JourneyStatus = "loading" | "moving" | "drawing" | "idle" | "error";

export const SKETCH_MS = 900;
