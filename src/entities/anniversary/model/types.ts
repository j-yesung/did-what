export type Anniversary = {
  /** 매년 반복 표시를 시작하는 날짜. */
  date: string;
  id: string;
  name: string;
};

export type AnniversaryDraft = Pick<Anniversary, "id" | "name"> & {
  monthDay: string;
};

export type FeaturedAnniversary = Pick<Anniversary, "date" | "name"> & {
  dday: number;
};

export type AnniversaryActionResult = {
  status: "success" | "error";
  message?: string;
};
