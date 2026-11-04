"use client";

import { useEffect, useState } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useSearchParams } from "next/navigation";

import { NOTIFICATIONS_QUERY_KEY } from "@/entities/notification";
import { recordDetailQueryOptions } from "@/entities/record";
import { readRecordNotifications } from "@/features/notification/read-record-notifications";
import { useDemoOverride } from "@/shared/lib/demo-override";
import { runServerAction } from "@/shared/lib/server-action/run-server-action";
import { showToast } from "@/shared/lib/toast";
import { isUuid } from "@/shared/lib/validation/is-uuid";

import { RecordDetailBottomSheet } from "./record-detail-bottom-sheet";

type Member = { id: string; name: string };

export function RecordRouteSheet({ member }: { member: Member }) {
  const params = useSearchParams();
  const recordId = params?.get("recordDetail");
  if (!recordId || !isUuid(recordId)) return null;
  return <OpenRecordSheet key={recordId} member={member} recordId={recordId} />;
}

function OpenRecordSheet({ member, recordId }: { member: Member; recordId: string }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const markRead = useDemoOverride(readRecordNotifications);
  const recordQuery = useQuery({ ...recordDetailQueryOptions(recordId), refetchOnMount: "always" });
  const missingRecord = recordQuery.isSuccess && !recordQuery.isFetching && !recordQuery.data;
  const fromNotification = params?.get("recordFrom") === "notification";

  // 처음부터 열린 상태로 마운트하면 Drawer가 진입 전환을 생략한다.
  useEffect(() => setOpen(true), []);

  useEffect(() => {
    if (!fromNotification) return;
    void runServerAction(() => markRead(recordId))
      .then(() => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }))
      .catch(() => {});
  }, [fromNotification, markRead, queryClient, recordId]);

  const next = new URLSearchParams(params?.toString());
  next.delete("recordDetail");
  next.delete("recordFrom");
  const search = next.toString();
  const closeHref = `${pathname}${search ? `?${search}` : ""}`;

  useEffect(() => {
    if (!fromNotification || !missingRecord) return;
    showToast({ title: "기록이 삭제됐어요", variant: "warning" });
    // 캐시에 이미 없는 기록은 시트가 열리기 전에도 바로 목록으로 돌아간다.
    window.history.replaceState(null, "", closeHref);
  }, [fromNotification, missingRecord, closeHref]);

  const close = () => window.history.replaceState(null, "", closeHref);

  return (
    <RecordDetailBottomSheet
      backLabel="기록으로"
      showBackButton={false}
      member={member}
      onDeleted={() => setOpen(false)}
      onOpenChange={setOpen}
      onCloseComplete={close}
      open={open}
      record={{ id: recordId }}
    />
  );
}
