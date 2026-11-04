"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useSearchParams } from "next/navigation";

import { NOTIFICATIONS_QUERY_KEY } from "@/entities/notification";
import { closeRecordSheet } from "@/entities/record/model/record-sheet";
import { closeRecordSheetIntoCard } from "@/entities/record/model/record-sheet-morph";
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
  const closed = useRef(false);
  const queryClient = useQueryClient();
  const markRead = useDemoOverride(readRecordNotifications);
  const fromNotification = params?.get("recordFrom") === "notification";
  const fromCard = params?.get("recordFrom") === "card";

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

  const close = useCallback(() => {
    if (closed.current) return false;
    closed.current = true;
    closeRecordSheet(window.history, recordId, closeHref);
    return true;
  }, [recordId, closeHref]);

  const handleMissing = useCallback(() => {
    if (fromNotification && close()) showToast({ title: "기록이 삭제됐어요", variant: "warning" });
  }, [fromNotification, close]);

  return (
    <RecordDetailBottomSheet
      backLabel="기록으로"
      screen={fromCard}
      showBackButton={fromCard}
      member={member}
      onDeleted={() => setOpen(false)}
      onMissing={handleMissing}
      onOpenChange={(nextOpen) => {
        if (nextOpen) setOpen(true);
        else closeRecordSheetIntoCard(recordId, () => setOpen(false));
      }}
      onCloseComplete={close}
      open={open}
      record={{ id: recordId }}
    />
  );
}
