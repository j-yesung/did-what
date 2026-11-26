"use client";

import { type FormEvent, useId, useState } from "react";

import { PlusIcon } from "@phosphor-icons/react";

import type { AnniversaryActionResult, AnniversaryDraft } from "@/entities/anniversary/model/types";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { Button } from "@/shared/ui/button";

import { AnniversaryFields } from "./anniversary-fields";

type AnniversarySheetProps = {
  today: string;
  formStyle?: "night" | "date" | "line";
  onCreate: (anniversary: AnniversaryDraft) => Promise<AnniversaryActionResult>;
};

export function AnniversarySheet({ today, formStyle, onCreate }: AnniversarySheetProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<AnniversaryDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const formId = useId();

  const handleOpenChange = (nextOpen: boolean) => {
    if (busy) return;
    if (nextOpen) {
      setError("");
      setDraft({ monthDay: today.slice(5), id: crypto.randomUUID(), name: "" });
    }
    setOpen(nextOpen);
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft || busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await onCreate(draft);
      if (result.status === "error") setError(result.message ?? "기념일을 저장하지 못했어요.");
      else setOpen(false);
    } catch {
      setError("기념일을 저장하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <BottomSheet onOpenChange={handleOpenChange} open={open} showSwipeHandle>
      <BottomSheet.Trigger render={<Button fullWidth size="large" type="button" />}>
        <PlusIcon aria-hidden="true" data-icon="inline-start" />
        기념일 추가
      </BottomSheet.Trigger>
      <BottomSheet.VirtualKeyboardProvider>
        <BottomSheet.Content className="bottom-(--drawer-keyboard-inset,0px) [--bottom-sheet-content-max-height:calc(75dvh-var(--drawer-keyboard-inset,0px))]">
          <BottomSheet.Header>
            <BottomSheet.Title className="text-left font-bold text-xl tracking-[-0.03em]">
              기념일 추가
            </BottomSheet.Title>
          </BottomSheet.Header>
          <div className="min-h-0 overflow-y-auto overscroll-contain px-5 py-4">
            {draft && (
              <form id={formId} onSubmit={save}>
                <fieldset disabled={busy} className="min-w-0 border-0 p-0">
                  <AnniversaryFields
                    draft={draft}
                    error={error}
                    onChange={(nextDraft) => {
                      setDraft(nextDraft);
                      setError("");
                    }}
                    style={formStyle}
                  />
                </fieldset>
              </form>
            )}
          </div>
          <BottomSheet.Footer>
            <div className="grid grid-cols-2 gap-2">
              <BottomSheet.Close
                render={<Button color="dark" disabled={busy} size="large" type="button" variant="weak" />}
              >
                취소
              </BottomSheet.Close>
              <Button form={formId} loading={busy} size="large" type="submit">
                저장
              </Button>
            </div>
          </BottomSheet.Footer>
        </BottomSheet.Content>
      </BottomSheet.VirtualKeyboardProvider>
    </BottomSheet>
  );
}
