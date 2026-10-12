"use client";

import { createContext, useContext } from "react";

import type { RecordFormState } from "@/entities/record";

type DemoContextValue = {
  createRecord: (formData: FormData) => Promise<RecordFormState>;
  updateRecord: (recordId: string, formData: FormData) => Promise<RecordFormState>;
};

export const DemoContext = createContext<DemoContextValue | null>(null);

export const useDemo = () => {
  const value = useContext(DemoContext);
  if (!value) throw new Error("DemoRuntime 안에서만 쓸 수 있어요.");
  return value;
};
