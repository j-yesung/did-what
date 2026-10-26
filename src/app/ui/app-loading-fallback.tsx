"use client";

import { use, useEffect } from "react";

import { AppLoading } from "./app-loading";

const never = new Promise<never>(() => {});
let appShown = false;

export function AppShown() {
  useEffect(() => {
    appShown = true;
  }, []);

  return null;
}

export function AppLoadingFallback({ hold = false }: { hold?: boolean }) {
  if (typeof window !== "undefined" && (hold || appShown)) use(never);
  return <AppLoading />;
}
