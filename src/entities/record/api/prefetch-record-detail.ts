import type { QueryClient } from "@tanstack/react-query";

import { recordDetailQueryOptions } from "./queries";

export const prefetchRecordDetail = (queryClient: QueryClient, recordId: string) => {
  void queryClient.prefetchQuery(recordDetailQueryOptions(recordId));
};
