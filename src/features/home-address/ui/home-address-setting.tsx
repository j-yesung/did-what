"use client";

import { useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog, ConfirmDialogCancelButton } from "@/shared/ui/confirm-dialog";
import { FieldLegend, FieldSet } from "@/shared/ui/field";

import { deleteHomeAddress } from "../api/actions";
import { HomeAddressSheet } from "./home-address-sheet";

export function HomeAddressSetting({ address, memberName }: { address: string | null; memberName: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, startDeleteTransition] = useTransition();

  const router = useRouter();

  return (
    <FieldSet>
      <FieldLegend>나의 집 주소</FieldLegend>
      <div className="flex items-center gap-3">
        <p className="min-w-0 flex-1 truncate text-sm">{address ?? "등록된 주소가 없어요"}</p>
        <HomeAddressSheet address={address} memberName={memberName} onOpenChange={setOpen} open={open}>
          <BottomSheet.Trigger render={<Button size="small" type="button" variant="outline" />}>
            {address ? "변경" : "등록"}
          </BottomSheet.Trigger>
        </HomeAddressSheet>
        {address && (
          <Button
            type="button"
            color="danger"
            variant="weak"
            onClick={() => {
              setError("");
              setDeleteConfirmOpen(true);
            }}
          >
            삭제
          </Button>
        )}
        <ConfirmDialog
          open={deleteConfirmOpen}
          onClose={() => {
            if (!deleting) setDeleteConfirmOpen(false);
          }}
          title="집 주소를 삭제할까요?"
          description={error || "주소를 삭제하면 집에서 출발하는 경로를 볼 수 없어요."}
          cancelButton={
            <ConfirmDialogCancelButton disabled={deleting} onClick={() => setDeleteConfirmOpen(false)}>
              취소
            </ConfirmDialogCancelButton>
          }
          confirmButton={
            <Button
              color="danger"
              variant="fill"
              loading={deleting}
              onClick={() => {
                setError("");
                startDeleteTransition(async () => {
                  const result = await deleteHomeAddress();
                  if (result.error) setError(result.error);
                  else {
                    setDeleteConfirmOpen(false);
                    setOpen(false);
                    router.refresh();
                  }
                });
              }}
            >
              주소 삭제
            </Button>
          }
        />
      </div>
    </FieldSet>
  );
}
