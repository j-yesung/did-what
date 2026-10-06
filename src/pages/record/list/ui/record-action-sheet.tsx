"use client";

import { useState } from "react";

import { formatRecordRegionLabels, RecordCategoryBadge, type RecordSummary } from "@/entities/record";
import { DeleteRecordConfirm } from "@/features/record/delete-record";
import { formatRecordPeriod } from "@/shared/lib/date/format-date";
import { ActionSheet } from "@/shared/ui/action-sheet";
import { Button } from "@/shared/ui/button";
import { PressLink } from "@/shared/ui/press-link";

type RecordActionSheetProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  /** 닫히는 동안에도 내용이 남아 있어야 해서 닫은 뒤에도 비우지 않는다. */
  record: RecordSummary | null;
};

export function RecordActionSheet({ onOpenChange, open, record }: RecordActionSheetProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <ActionSheet
        description={
          record ? (
            <>
              {[formatRecordPeriod(record.recorded_at, record.recorded_until), formatRecordRegionLabels(record)]
                .filter(Boolean)
                .join(" · ")}
              <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                <RecordCategoryBadge category={record.category} />
              </span>
            </>
          ) : null
        }
        onOpenChange={onOpenChange}
        open={open}
        title={record?.activity}
      >
        <Button
          color="dark"
          nativeButton={false}
          render={<PressLink href={`/records/${record?.id}/edit`} />}
          size="large"
          variant="weak"
        >
          수정하기
        </Button>
        <Button
          color="danger"
          onClick={() => {
            onOpenChange(false);
            setConfirmOpen(true);
          }}
          size="large"
          variant="weak"
        >
          삭제하기
        </Button>
      </ActionSheet>

      <DeleteRecordConfirm
        activity={record?.activity ?? ""}
        onClose={() => setConfirmOpen(false)}
        open={confirmOpen}
        recordId={record?.id ?? ""}
      />
    </>
  );
}
