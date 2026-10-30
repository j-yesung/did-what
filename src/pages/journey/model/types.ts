import type { JourneyRecord } from "./record";

export type JourneyPoint = { latitude: number; longitude: number };
export type JourneyPlace = JourneyPoint & { id: string; name: string };
export type JourneyRegion = JourneyPoint & { code: string; name: string; count: number };
export type JourneyRoute = { points: [number, number][]; distance: number; duration: number; straight?: boolean };
export type JourneyStatus = "loading" | "moving" | "drawing" | "idle" | "error";

export type JourneySegment = {
  route: JourneyRoute;
  target: JourneyPlace | null;
  from: JourneyPoint | null;
  to: JourneyPoint;
  key: number;
};

export type JourneySession = {
  record: JourneyRecord;
  region: JourneyRegion;
  segments: JourneySegment[];
  queue: JourneyPlace[];
  active: JourneyPlace | null;

  status: JourneyStatus;
  error: string;
  current: JourneyPlace | null;

  replaying: boolean;
  restored?: boolean;
};

export type JourneySheetKind = "regions" | "choices" | "records";
