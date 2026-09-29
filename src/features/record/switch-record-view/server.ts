import "server-only";

import { cookies } from "next/headers";

import { parseRecordView, RECORD_VIEW_COOKIE } from "./model/record-view-preference";

export const getRecordView = async () => {
  const store = await cookies();

  return parseRecordView(store.get(RECORD_VIEW_COOKIE)?.value);
};
