"use client";

import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/shared/ui/button";

import { prefetchRecordDetail } from "../api/prefetch-record-detail";
import type { RecordSummary } from "../model/types";
import { RECORD_CARD_BUTTON_CLASS, RecordCardContent, RecordCardFrame } from "./record-card-content";
import { RecordDetailLink } from "./record-detail-link";

type RecordCardProps = {
  onDetailPrefetch?: (recordId: string) => void;
  record: RecordSummary;
};

export function RecordCard({ onDetailPrefetch, record }: RecordCardProps) {
  const queryClient = useQueryClient();
  const href = `/records/${record.id}`;

  return (
    <RecordCardFrame>
      <Button
        className={RECORD_CARD_BUTTON_CLASS}
        fullWidth
        nativeButton={false}
        render={
          <RecordDetailLink
            href={href}
            onPointerDown={(event) => {
              if (event.button !== 0) return;
              prefetchRecordDetail(queryClient, record.id);
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
