"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { getAppPathname } from "./app-pathname";
import { canGoBack } from "./use-go-back";

const SENTINEL = "leaveGuard";

type LeaveGuardOptions = {
  busy?: boolean;
  fallbackHref: string;
  isDirty: () => boolean;
};

export const useLeaveGuard = ({ busy = false, fallbackHref, isDirty }: LeaveGuardOptions) => {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const couldGoBack = useRef(false);
  const leaving = useRef(false);
  const restoring = useRef(false);

  const leaveToFallback = () => {
    leaving.current = true;
    setConfirmOpen(false);
    router.replace(fallbackHref);
  };

  const onPopState = useEffectEvent((event: PopStateEvent) => {
    if (leaving.current) return;

    if (busy) {
      window.history.forward();
      return;
    }

    if (restoring.current && event.state?.[SENTINEL]) {
      restoring.current = false;
      setConfirmOpen(true);
      return;
    }

    if (event.state?.[SENTINEL]) {
      setConfirmOpen(false);
      return;
    }

    if (isDirty()) {
      restoring.current = true;
      window.history.forward();
      return;
    }

    leaving.current = true;
    window.history.back();
  });

  const onBeforeUnload = useEffectEvent((event: BeforeUnloadEvent) => {
    if (leaving.current || !isDirty()) return;
    event.preventDefault();
    event.returnValue = "";
  });

  useEffect(() => {
    const state = window.history.state ?? {};
    couldGoBack.current = Boolean(state[SENTINEL]) || canGoBack();
    if (couldGoBack.current && !state[SENTINEL]) {
      window.history.pushState({ ...state, [SENTINEL]: true }, "", window.location.href);
    }

    const handlePopState = (event: PopStateEvent) => onPopState(event);
    const handleBeforeUnload = (event: BeforeUnloadEvent) => onBeforeUnload(event);
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return {
    confirmOpen,
    confirmLeave: () => {
      if (!couldGoBack.current) {
        leaveToFallback();
        return;
      }
      leaving.current = true;
      setConfirmOpen(false);
      window.history.go(-2);
    },
    exit: () => {
      if (couldGoBack.current) window.history.back();
      else if (isDirty()) setConfirmOpen(true);
      else leaveToFallback();
    },
    finish: (destination: string) => {
      leaving.current = true;
      if (!couldGoBack.current) {
        router.replace(destination);
        return;
      }
      window.addEventListener(
        "popstate",
        () => {
          if (![getAppPathname(destination), "/"].includes(getAppPathname())) router.push(destination);
        },
        { once: true },
      );
      window.history.go(-2);
    },
    stay: () => setConfirmOpen(false),
  };
};
