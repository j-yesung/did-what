"use client";

import { type ReactNode, useState } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import {
  RecordActionToolbar,
  type RecordSummary,
  recordDetailQueryOptions,
  recordSummaryQueryKey,
} from "@/entities/record";
import { DeleteRecordConfirm } from "@/features/record/delete-record";

type RecordToolbarActionsProps = { children: ReactNode; recordId: string };

export function RecordToolbarActions({ children, recordId }: RecordToolbarActionsProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const summaryKey = recordSummaryQueryKey(recordId);
  const summary = queryClient.getQueryState(summaryKey)?.isInvalidated
    ? undefined
    : queryClient.getQueryData<RecordSummary>(summaryKey);
  const recordQuery = useQuery({ ...recordDetailQueryOptions(recordId), enabled: !summary });
  const record = recordQuery.data ?? summary;

  return (
    <>
      <RecordActionToolbar disabled={!record} onDelete={() => setDeleteOpen(true)} recordId={recordId}>
        {children}
      </RecordActionToolbar>
      <DeleteRecordConfirm
        activity={record?.activity ?? ""}
        onClose={() => setDeleteOpen(false)}
        onDeleted={() => router.replace("/records")}
        open={deleteOpen}
        recordId={recordId}
      />
    </>
  );
}
