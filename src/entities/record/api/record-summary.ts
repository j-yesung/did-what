import type { QueryClient } from "@tanstack/react-query";

import type { RecordSummary } from "../model/types";
import { recordDetailQueryOptions, recordSummaryQueryKey } from "./queries";

/** 목록에서 누른 기록의 요약을 담아 둔다. 상세가 오기 전까지 이 값으로 바로 그린다. */
export const cacheRecordSummary = (queryClient: QueryClient, record: RecordSummary) => {
  queryClient.setQueryData(recordSummaryQueryKey(record.id), record);
};

/** 누르는 순간 상세를 받기 시작한다. 요약이 있으면 함께 담는다. */
export const prefetchRecordDetail = (queryClient: QueryClient, recordId: string, summary?: RecordSummary) => {
  if (summary) cacheRecordSummary(queryClient, summary);
  void queryClient.prefetchQuery(recordDetailQueryOptions(recordId));
};

/** 담아 둔 요약. 무효화됐으면 버린다. 캐시를 구독하지 않고 읽으므로 상세 쿼리를 함께 쓰는 컴포넌트에서만 쓴다. */
export const getRecordSummary = (queryClient: QueryClient, recordId: string) => {
  const state = queryClient.getQueryState<RecordSummary>(recordSummaryQueryKey(recordId));
  return state?.data && !state.isInvalidated ? { data: state.data, updatedAt: state.dataUpdatedAt } : undefined;
};

/** 요약이 상세보다 새로우면(목록이 먼저 갱신된 경우) 요약을, 아니면 상세를 쓴다. */
export const pickNewerRecord = <T>(
  summary: ReturnType<typeof getRecordSummary>,
  detail: T | null | undefined,
  detailUpdatedAt: number,
) => (summary && summary.updatedAt > detailUpdatedAt ? summary.data : (detail ?? summary?.data));
