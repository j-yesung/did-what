"use client";

import { type ReactNode, useState } from "react";

import { Ssgoi, type SsgoiConfig, type SsgoiFramework, SsgoiLayoutBoundary } from "@ssgoi/react";
import { drill, IntegratorProvider, type MultiAnimation, type PhysicsOptions } from "@ssgoi/react/view-transitions";
import { useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";

import { DRILL_ROUTES, isDrill, isDrillPath } from "@/app/model/drill-routes";
import { cn } from "@/shared/lib/utils";

const DRILL_PHYSICS: PhysicsOptions = {
  spring: { stiffness: 500, damping: 37, restDelta: 0.005, restSpeed: 0.05 },
};

const speedUp = ({ animation }: { animation: MultiAnimation<"in" | "out"> }) => {
  for (const track of ["in", "out"] as const) {
    animation.select(track).set({ integrator: IntegratorProvider.from(DRILL_PHYSICS) });
  }
};

const config: SsgoiConfig = {
  transitions: DRILL_ROUTES.map((route) => ({
    ...route,
    transition: drill(undefined, { override: { backward: speedUp, forward: speedUp } }),
  })),
};
const reducedMotionConfig: SsgoiConfig = { transitions: [] };

const framework: SsgoiFramework = {
  useRoute() {
    const pathname = usePathname();
    return pathname ? { pathname } : null;
  },
};

export function AppRouteTransitions({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [visit, setVisit] = useState<{ pathname: string | null; from: string | null }>({ pathname, from: null });

  const from = visit.pathname === pathname ? visit.from : visit.pathname;

  if (visit.pathname !== pathname) setVisit({ pathname, from });

  return (
    <div
      className={cn(
        "relative z-0 min-h-dvh overflow-x-clip [&[data-suppress-page-entrance]_main]:animate-none",
        isDrillPath(pathname) && "mx-auto w-full max-w-(--app-width)",
      )}
      data-suppress-page-entrance={isDrill(from, pathname) || isDrill(pathname, from) || undefined}
    >
      <Ssgoi config={reduceMotion ? reducedMotionConfig : config} framework={framework}>
        <SsgoiLayoutBoundary>{children}</SsgoiLayoutBoundary>
      </Ssgoi>
    </div>
  );
}
