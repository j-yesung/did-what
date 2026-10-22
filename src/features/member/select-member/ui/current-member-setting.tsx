"use client";

import { useState } from "react";

import { type AccountMember, getMemberAvatarTone, getMemberInitial } from "@/entities/member";
import { cn } from "@/shared/lib/utils";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { Button } from "@/shared/ui/button";
import { FieldLegend, FieldSet } from "@/shared/ui/field";

import { MemberSelect } from "./member-select";

export function CurrentMemberSetting({
  member,
  members,
}: {
  member: Pick<AccountMember, "id" | "name">;
  members: AccountMember[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <FieldSet>
      <FieldLegend>현재 사용자</FieldLegend>
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-2xl font-semibold text-lg",
            getMemberAvatarTone(member.id),
          )}
        >
          {getMemberInitial(member.name)}
        </span>
        <p className="min-w-0 flex-1 truncate font-semibold text-base">{member.name}</p>
        <BottomSheet onOpenChange={setOpen} open={open} showSwipeHandle>
          <BottomSheet.Trigger render={<Button size="small" type="button" variant="outline" />}>
            전환
          </BottomSheet.Trigger>
          <BottomSheet.Content>
            <BottomSheet.Header>
              <BottomSheet.Title className="text-left font-bold text-xl">누가 사용 중인가요?</BottomSheet.Title>
              <BottomSheet.Description className="mt-2 text-left">
                선택한 이름으로 댓글을 남기고 알림을 확인해요.
              </BottomSheet.Description>
            </BottomSheet.Header>
            <div className="min-h-0 overflow-y-auto overscroll-contain px-5 pt-4 pb-7">
              <MemberSelect
                currentMemberId={member.id}
                destination="/settings"
                members={members.filter((candidate) => candidate.is_active)}
                onSelected={() => setOpen(false)}
              />
            </div>
          </BottomSheet.Content>
        </BottomSheet>
      </div>
    </FieldSet>
  );
}
