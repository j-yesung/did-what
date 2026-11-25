export type Anniversary = {
  date: string;
  id: string;
  name: string;
};

export type FeaturedAnniversary = Pick<Anniversary, "date" | "name"> & {
  dday: number;
};

export type AnniversaryActionResult = {
  status: "success" | "error";
  message?: string;
};
