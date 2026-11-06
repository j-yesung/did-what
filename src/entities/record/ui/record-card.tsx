"use client";

import type { ComponentProps } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { PRESS_FEEDBACK } from "@/shared/lib/interaction";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

import { prefetchRecordDetail } from "../api/prefetch-record-detail";
import { normalizeRecordCategory, RECORD_CATEGORY_BADGE } from "../model/category";
import { RECORD_CARD_BUTTON_CLASS, RecordCardContent } from "./record-card-content";
import { RecordDetailLink } from "./record-detail-link";

type RecordCardProps = {
  onDetailPrefetch?: (recordId: string) => void;
  onOpen?: (recordId: string) => void;
  record: ComponentProps<typeof RecordCardContent>["record"] & { id: string };
};

export function RecordCard({ onDetailPrefetch, onOpen, record }: RecordCardProps) {
  const queryClient = useQueryClient();
  const href = `/records/${record.id}`;

  return (
    <article className="mt-2 min-w-0">
      <Button
        className={cn(
          RECORD_CARD_BUTTON_CLASS,
          "rounded-3xl px-4.5 py-4.5",
          PRESS_FEEDBACK,
          RECORD_CATEGORY_BADGE[normalizeRecordCategory(record.category)],
        )}
        fullWidth
        nativeButton={Boolean(onOpen)}
        onFocus={() => prefetchRecordDetail(queryClient, record.id)}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          prefetchRecordDetail(queryClient, record.id);
          onDetailPrefetch?.(record.id);
        }}
        render={
          onOpen ? (
            <button type="button" onClick={() => onOpen(record.id)} />
          ) : (
            <RecordDetailLink href={href} prefetch={false} />
          )
        }
        variant="ghost"
      >
        <RecordCardContent record={record} />
      </Button>
    </article>
  );
}
