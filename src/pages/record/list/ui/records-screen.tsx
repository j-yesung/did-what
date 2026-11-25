"use client";

import { useCallback, useSyncExternalStore } from "react";

import { useQuery } from "@tanstack/react-query";

import { anniversariesQueryOptions } from "@/entities/anniversary/api/anniversaries";
import { getAnniversaryNamesForDate } from "@/entities/anniversary/model/anniversary";
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
  const { data: anniversaries } = useQuery(anniversariesQueryOptions);
  const namesForDate = useCallback(
    (date: string) => getAnniversaryNamesForDate(anniversaries ?? [], date),
    [anniversaries],
  );
  const currentSavedView = useSyncExternalStore(subscribeNothing, readSavedRecordView, () => savedView);
  return <RecordsContent anniversaryNamesForDate={namesForDate} view={paramsView ?? currentSavedView ?? "list"} />;
}
