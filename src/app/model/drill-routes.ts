const TOOLBAR_PATHS = ["/", "/records", "/places", "/settings"];

export const DRILL_ROUTES = [
  { from: ["/"], to: "/anniversaries" },
  { from: [...TOOLBAR_PATHS, "/places/*"], to: "/records/new" },
  { from: TOOLBAR_PATHS, to: "/notifications" },
  { from: ["/", "/places"], to: "/places/*" },
];

const matchesRoute = (pattern: string, path: string | null) => {
  if (path === null) return false;
  return pattern.endsWith("/*") ? path.startsWith(pattern.slice(0, -1)) : path === pattern;
};

export const isDrill = (from: string | null, to: string | null) => {
  return DRILL_ROUTES.some(
    (route) => matchesRoute(route.to, to) && route.from.some((pattern) => matchesRoute(pattern, from)),
  );
};

export const isDrillPath = (path: string | null) => {
  return DRILL_ROUTES.some((route) => [route.to, ...route.from].some((pattern) => matchesRoute(pattern, path)));
};
