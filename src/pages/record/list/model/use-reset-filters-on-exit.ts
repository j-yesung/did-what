import { useEffect } from "react";

export const useResetFiltersOnExit = (active: boolean) => {
  useEffect(() => {
    if (!active) return;

    const resetFiltersOnExit = () => {
      window.history.replaceState(window.history.state, "", "/records");
    };

    window.addEventListener("pagehide", resetFiltersOnExit);
    return () => window.removeEventListener("pagehide", resetFiltersOnExit);
  }, [active]);
};
