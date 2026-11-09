"use client";

import { useSyncExternalStore } from "react";

import {
  type RecordView,
  readSavedRecordView,
} from "@/features/record/switch-record-view/model/record-view-preference";

import { RecordsContent } from "./records-content";

const subscribeNothing = () => () => {};

type RecordsScreenProps = {
  paramsView: RecordView | null;
  savedView: RecordView | null;
};

export function RecordsScreen({ paramsView, savedView }: RecordsScreenProps) {
  const currentSavedView = useSyncExternalStore(subscribeNothing, readSavedRecordView, () => savedView);
  return <RecordsContent view={paramsView ?? currentSavedView ?? "list"} />;
}
