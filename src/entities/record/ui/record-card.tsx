"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { Button } from "@/shared/ui/button";
import { PressLink } from "@/shared/ui/press-link";

import { cacheRecordSummary, prefetchRecordDetail } from "../api/record-summary";
import type { RecordSummary } from "../model/types";
import { RECORD_CARD_BUTTON_CLASS, RecordCardContent, RecordCardFrame } from "./record-card-content";

type RecordCardProps = {
  endsMonth: boolean;
  onDetailPrefetch?: (recordId: string) => void;
  record: RecordSummary;
};

export function RecordCard({ endsMonth, onDetailPrefetch, record }: RecordCardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const href = `/records/${record.id}`;
  const cacheSummary = () => cacheRecordSummary(queryClient, record);

  return (
    <RecordCardFrame category={record.category} endsMonth={endsMonth}>
      <Button
        className={RECORD_CARD_BUTTON_CLASS}
        fullWidth
        nativeButton={false}
        render={
          <PressLink
            href={href}
            onClick={cacheSummary}
            onPointerDown={(event) => {
              if (event.button !== 0) return;
              router.prefetch(href);
              prefetchRecordDetail(queryClient, record.id, record);
              onDetailPrefetch?.(record.id);
            }}
            prefetch={false}
          />
        }
        variant="ghost"
      >
        <RecordCardContent record={record} />
      </Button>
    </RecordCardFrame>
  );
}
