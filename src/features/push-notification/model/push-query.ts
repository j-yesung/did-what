import { queryOptions } from "@tanstack/react-query";

import { getPushEndpoint } from "./subscribe";

export const pushEndpointQueryOptions = queryOptions({
  queryKey: ["push-endpoint"],
  queryFn: getPushEndpoint,
});
