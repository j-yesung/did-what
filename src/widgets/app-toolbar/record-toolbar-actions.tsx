"use client";

import { type ReactNode, useState } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { getRecordSummary, pickNewerRecord, RecordActionToolbar, recordDetailQueryOptions } from "@/entities/record";
import { DeleteRecordConfirm } from "@/features/record/delete-record";

type RecordToolbarActionsProps = { children: ReactNode; recordId: string };

export function RecordToolbarActions({ children, recordId }: RecordToolbarActionsProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const summary = getRecordSummary(queryClient, recordId);
  const recordQuery = useQuery({ ...recordDetailQueryOptions(recordId), enabled: !summary });
  const record = pickNewerRecord(summary, recordQuery.data, recordQuery.dataUpdatedAt);

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
