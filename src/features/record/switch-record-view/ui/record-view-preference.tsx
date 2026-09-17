"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import { type RecordView, readRecordView } from "../model/record-view-preference";

type RecordViewPreferenceProps = {
  hasExplicitView: boolean;
  view: RecordView;
};

export function RecordViewPreference({ hasExplicitView, view }: RecordViewPreferenceProps) {
  const router = useRouter();

  useEffect(() => {
    if (hasExplicitView) return;
    const storedView = readRecordView();
    if (!storedView || storedView === view) return;

    router.replace(storedView === "calendar" ? "/records?view=calendar" : "/records");
  }, [hasExplicitView, router, view]);

  return null;
}
