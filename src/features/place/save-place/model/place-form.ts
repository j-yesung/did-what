export type CreatePlaceInput = {
  page: number;
  placeId: string;
  query: string;
};

export type PlaceActionState = {
  status: "idle" | "error" | "success";
  message?: string;
};
