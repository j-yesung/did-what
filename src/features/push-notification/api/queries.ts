import { queryOptions } from "@tanstack/react-query";

import { getPushEndpoint } from "@/shared/lib/push/get-push-endpoint";

export const pushEndpointQueryOptions = queryOptions({
  queryKey: ["push-endpoint"],
  queryFn: getPushEndpoint,
});
