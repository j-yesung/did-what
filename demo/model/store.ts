"use client";

import { useSyncExternalStore } from "react";

import { getToday } from "@/shared/lib/date/get-today";

import { createSeedState, DEMO_STATE_VERSION } from "./seed.ts";
import type { DemoState } from "./types.ts";

/**
 * 체험 데이터는 이 탭의 sessionStorage에만 둔다. 다른 탭·브라우저와 섞이지 않고 탭을 닫으면 사라진다.
 * 부모 페이지와 iframe은 같은 탭이라 같은 저장소를 본다. 초기화는 부모가 이 키를 지운 뒤 앱을 다시 연다.
 */
export const DEMO_STORAGE_KEY = "did-what-demo:state";

let state: DemoState | null = null;
const listeners = new Set<() => void>();

const load = (): DemoState => {
  try {
    const saved = JSON.parse(sessionStorage.getItem(DEMO_STORAGE_KEY) ?? "null") as DemoState | null;
    if (saved?.version === DEMO_STATE_VERSION) return saved;
  } catch {
    // 저장소를 못 쓰는 환경(비공개 창 등)에서는 메모리에만 두고 처음 샘플로 시작한다.
  }
  return createSeedState(getToday());
};

export const demoStore = {
  get: () => {
    state ??= load();
    return state;
  },
  set: (next: DemoState) => {
    state = next;
    try {
      sessionStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // 저장하지 못해도 이 화면을 쓰는 동안은 메모리 값으로 이어 간다.
    }
    for (const listener of listeners) listener();
  },
  update: (change: (current: DemoState) => DemoState) => demoStore.set(change(demoStore.get())),
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export const clearDemoStorage = () => {
  try {
    sessionStorage.removeItem(DEMO_STORAGE_KEY);
  } catch {
    // 지울 저장소가 없으면 다시 열 때 어차피 처음 샘플로 시작한다.
  }
};

export const useDemoState = () => useSyncExternalStore(demoStore.subscribe, demoStore.get, demoStore.get);
