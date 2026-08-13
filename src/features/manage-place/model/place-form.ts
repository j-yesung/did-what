export type PlaceActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  saved?: boolean;
};

export const INITIAL_PLACE_ACTION_STATE: PlaceActionState = { status: "idle" };
