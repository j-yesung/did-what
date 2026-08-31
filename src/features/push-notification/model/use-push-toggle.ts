"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";

import { BellOffIcon, BellRingIcon } from "@animateicons/react/lucide";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { showNotice } from "@/shared/lib/notice";
import { runServerAction } from "@/shared/lib/server-action/run-server-action";

import { removeSubscription, saveSubscription } from "./actions";
import { pushEndpointQueryOptions } from "./push-query";
import { disablePush, enablePush, isPushSupported } from "./subscribe";

export function usePushToggle() {
  const queryClient = useQueryClient();

  const [hydrated, setHydrated] = useState(false);
  const [unsupported, setUnsupported] = useState(false);

  const pendingChecked = useRef<boolean | null>(null);
  const pendingToggle = useRef<Promise<void> | null>(null);

  const isUnsupported = hydrated && (unsupported || !isPushSupported());

  const canLoadEndpoint = hydrated && !isUnsupported;
  const pushEndpointQuery = useQuery({ ...pushEndpointQueryOptions, enabled: canLoadEndpoint });
  const isOn = Boolean(pushEndpointQuery.data);

  const [checked, setOptimisticChecked] = useOptimistic(isOn, (_, nextChecked: boolean) => nextChecked);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setHydrated(true);
  }, []);

  async function turnOn() {
    const result = await enablePush();

    if (result.status === "unsupported") {
      setUnsupported(true);
      queryClient.setQueryData(pushEndpointQueryOptions.queryKey, null);
      showNotice({ title: "이 브라우저에서는 알림을 지원하지 않아요", variant: "warning" });
      return;
    }

    if (result.status === "denied") {
      showNotice({
        description: "브라우저나 기기 설정에서 이 사이트의 알림을 허용해 주세요.",
        title: "알림이 차단돼 있어요",
        variant: "warning",
      });
      return;
    }

    if (result.status === "dismissed") {
      showNotice({
        description: "권한 창이 뜨지 않으면 브라우저의 알림 설정에서 직접 허용해 주세요.",
        title: "알림 권한을 받지 못했어요",
        variant: "warning",
      });
      return;
    }

    const saved = await runServerAction(() => saveSubscription(result.keys));
    if (saved?.status === "error") {
      await disablePush();
      queryClient.setQueryData(pushEndpointQueryOptions.queryKey, null);
      showNotice({
        description: saved.message,
        title: "알림을 켜지 못했어요",
        variant: "warning",
      });
      return;
    }

    queryClient.setQueryData(pushEndpointQueryOptions.queryKey, result.keys.endpoint);
  }

  async function turnOff() {
    const endpoint = await disablePush();
    queryClient.setQueryData(pushEndpointQueryOptions.queryKey, null);
    if (!endpoint) return;

    const removed = await runServerAction(() => removeSubscription(endpoint));
    if (removed?.status === "error") {
      showNotice({
        description: removed.message,
        title: "알림을 끄지 못했어요",
        variant: "warning",
      });
    }
  }

  async function processToggleQueue() {
    while (pendingChecked.current !== null) {
      const nextChecked = pendingChecked.current;
      pendingChecked.current = null;

      try {
        await (nextChecked ? turnOn() : turnOff());
      } catch {
        showNotice({
          title: nextChecked ? "알림을 켜지 못했어요" : "알림을 끄지 못했어요",
          variant: "error",
        });
      }
    }
  }

  function enqueueToggle(nextChecked: boolean) {
    pendingChecked.current = nextChecked;
    if (!pendingToggle.current) {
      pendingToggle.current = processToggleQueue().finally(() => {
        pendingToggle.current = null;
      });
    }

    return pendingToggle.current;
  }

  function handleCheckedChange(nextChecked: boolean) {
    showNotice({
      icon: nextChecked ? BellRingIcon : BellOffIcon,
      title: nextChecked ? "이 기기로 알림을 받아요" : "알림을 껐어요",
      variant: "success",
    });

    startTransition(async () => {
      setOptimisticChecked(nextChecked);
      await enqueueToggle(nextChecked);
    });
  }

  return { checked, isUnsupported, handleCheckedChange };
}
