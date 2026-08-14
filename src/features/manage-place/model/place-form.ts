export type PlaceActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  saved?: boolean;
};
