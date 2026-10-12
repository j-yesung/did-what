"use client";

import { useEffect, useRef } from "react";

import { useRouter } from "next/navigation";

import { AppLoading } from "./app-loading";

export function AppBootstrap() {
  const router = useRouter();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (window.location.pathname === "/app-start") router.replace("/", { scroll: false });
    else router.refresh();
  }, [router]);

  return <AppLoading />;
}
