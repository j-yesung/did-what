import { queryOptions } from "@tanstack/react-query";

import { MAIN_QUERY_OPTIONS } from "@/shared/lib/react-query/query-client";

import { fetchMembers } from "./fetch-members";

export const MEMBERS_QUERY_KEY = ["members"] as const;

export const membersQueryOptions = queryOptions({
  ...MAIN_QUERY_OPTIONS,
  queryKey: MEMBERS_QUERY_KEY,
  queryFn: fetchMembers,
});
