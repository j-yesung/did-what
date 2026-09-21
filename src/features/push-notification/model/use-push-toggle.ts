"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { runServerAction } from "@/shared/lib/server-action/run-server-action";
import { showToast } from "@/shared/lib/toast";

import { disablePush, enablePush, isPushSupported, pushEndpointQueryOptions } from "../api/browser-subscription";
import { removeSubscription, saveSubscription } from "../api/subscription-actions";

export const usePushToggle = () => {
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

  const turnOn = async () => {
    const result = await enablePush();

    if (result.status === "unsupported") {
      setUnsupported(true);
      queryClient.setQueryData(pushEndpointQueryOptions.queryKey, null);
      showToast({ title: "이 브라우저에서는\n알림을 지원하지 않아요", variant: "warning" });
      return;
    }

    if (result.status === "denied") {
      showToast({
        description: "브라우저나 기기 설정에서\n이 사이트의 알림을 허용해 주세요.",
        title: "알림이 차단돼 있어요",
        variant: "warning",
      });
      return;
    }

    if (result.status === "dismissed") {
      showToast({
        description: "권한 창이 뜨지 않으면\n브라우저의 알림 설정에서 직접 허용해 주세요.",
        title: "알림 권한을 받지 못했어요",
        variant: "warning",
      });
      return;
    }

    const saved = await runServerAction(() => saveSubscription(result.keys));
    if (saved?.status === "error") {
      await disablePush();
      queryClient.setQueryData(pushEndpointQueryOptions.queryKey, null);
      showToast({
        description: saved.message,
        title: "알림을 켜지 못했어요",
        variant: "warning",
      });
      return;
    }

    queryClient.setQueryData(pushEndpointQueryOptions.queryKey, result.keys.endpoint);
  };

  const turnOff = async () => {
    const endpoint = await disablePush();
    queryClient.setQueryData(pushEndpointQueryOptions.queryKey, null);
    if (!endpoint) return;

    const removed = await runServerAction(() => removeSubscription(endpoint));
    if (removed?.status === "error") {
      showToast({
        description: removed.message,
        title: "알림을 끄지 못했어요",
        variant: "warning",
      });
    }
  };

  const processToggleQueue = async () => {
    while (pendingChecked.current !== null) {
      const nextChecked = pendingChecked.current;
      pendingChecked.current = null;

      try {
        await (nextChecked ? turnOn() : turnOff());
      } catch {
        showToast({
          title: nextChecked ? "알림을 켜지 못했어요" : "알림을 끄지 못했어요",
          variant: "error",
        });
      }
    }
  };

  const enqueueToggle = (nextChecked: boolean) => {
    pendingChecked.current = nextChecked;
    if (!pendingToggle.current) {
      pendingToggle.current = processToggleQueue().finally(() => {
        pendingToggle.current = null;
      });
    }

    return pendingToggle.current;
  };

  const handleCheckedChange = (nextChecked: boolean) => {
    showToast({
      title: nextChecked ? `이 기기로 알림을 받아요` : "알림을 껐어요",
      variant: "success",
    });

    startTransition(async () => {
      setOptimisticChecked(nextChecked);
      await enqueueToggle(nextChecked);
    });
  };

  return { checked, isUnsupported, handleCheckedChange };
};
