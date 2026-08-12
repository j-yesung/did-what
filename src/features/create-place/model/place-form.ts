export type CreatePlaceActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  saved?: boolean;
};

export const INITIAL_CREATE_PLACE_STATE: CreatePlaceActionState = { status: "idle" };
