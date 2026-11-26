"use client";

import { useState } from "react";

import { type AccountMember, MemberAvatar } from "@/entities/member";
import { FOCUS_RING, PRESS_FEEDBACK } from "@/shared/lib/interaction";
import { getDirectionParticle } from "@/shared/lib/text/particle";
import { cn } from "@/shared/lib/utils";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { FieldDescription, FieldLegend, FieldSet } from "@/shared/ui/field";

import { useSelectMember } from "../model/use-select-member";
import { MemberSelect } from "./member-select";

export function CurrentMemberSetting({
  member,
  members,
}: {
  member: Pick<AccountMember, "id" | "name">;
  members: AccountMember[];
}) {
  const [open, setOpen] = useState(false);
  const activeMembers = members.filter((candidate) => candidate.is_active);
  const others = activeMembers.filter((candidate) => candidate.id !== member.id);
  const partner = others.length === 1 ? others[0] : null;
  const select = useSelectMember({ destination: "/settings", members: activeMembers });
  const stacked = partner
    ? activeMembers.filter((candidate) => candidate.id === member.id || candidate.id === partner.id)
    : [member];
  const failed = select.isError || select.data?.status === "error";
  const shown = (!failed && stacked.find((person) => person.id === select.variables)) || member;
  const other = partner ? stacked.find((person) => person.id !== shown.id) : null;
  const errorMessage = select.data?.message ?? (select.isError ? "사용자를 바꾸지 못했어요. 다시 시도해 주세요." : "");

  return (
    <FieldSet>
      <FieldLegend>현재 사용자</FieldLegend>
      <button
        className={cn(
          "flex w-full items-center gap-3.5 rounded-2xl text-left",
          PRESS_FEEDBACK,
          "after:hidden",
          FOCUS_RING,
        )}
        disabled={select.isPending}
        onClick={() => (partner ? select.mutate(partner.id) : setOpen(true))}
        type="button"
      >
        <span className={cn("relative h-12.5 shrink-0", partner ? "w-18.5" : "w-11")}>
          {stacked.map((person) => (
            <MemberAvatar
              className={cn(
                "absolute top-0.75 size-11 rounded-2xl text-lg shadow-[0_0_0_3px_var(--background)] transition-[left,scale,opacity] duration-450 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none",
                person.id === shown.id ? "left-0 z-2" : "left-7.5 z-1 scale-86 opacity-55",
              )}
              key={person.id}
              memberId={person.id}
              name={person.name}
            />
          ))}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate font-bold text-base">
            {shown.name}
            {getDirectionParticle(shown.name)} 쓰는 중
          </span>
          <span className="text-muted-foreground text-xs">
            {other ? `눌러서 ${other.name}${getDirectionParticle(other.name)} 바꾸기` : "눌러서 다른 사람으로 바꾸기"}
          </span>
        </span>
      </button>
      {errorMessage ? (
        <FieldDescription className="text-destructive" role="alert">
          {errorMessage}
        </FieldDescription>
      ) : null}
      <BottomSheet onOpenChange={setOpen} open={open} showSwipeHandle>
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
              members={activeMembers}
              onSelected={() => setOpen(false)}
            />
          </div>
        </BottomSheet.Content>
      </BottomSheet>
    </FieldSet>
  );
}
