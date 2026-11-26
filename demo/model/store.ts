"use client";

import { useSyncExternalStore } from "react";

import { normalizeRecordCategories } from "@/entities/record/model/options/category";
import { getToday } from "@/shared/lib/date/get-today";

import { createSeedState, DEMO_STATE_VERSION } from "./seed.ts";
import type { DemoState } from "./types.ts";

export const DEMO_STORAGE_KEY = "did-what-demo:state";

let state: DemoState | null = null;
const listeners = new Set<() => void>();

const load = (): DemoState => {
  try {
    const saved = JSON.parse(sessionStorage.getItem(DEMO_STORAGE_KEY) ?? "null") as DemoState | null;
    if (saved?.version === DEMO_STATE_VERSION) {
      return {
        ...saved,
        anniversaries: saved.anniversaries ?? [],
        records: saved.records.map((record) => ({
          ...record,
          category: normalizeRecordCategories(record.category).slice(0, 1),
        })),
      };
    }
  } catch {}
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
    } catch {}
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
  } catch {}
};

export const useDemoState = () => useSyncExternalStore(demoStore.subscribe, demoStore.get, demoStore.get);
