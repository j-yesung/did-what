"use client";

import { CheckIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";

import { type AccountMember, getMemberAvatarTone, getMemberInitial } from "@/entities/member";
import { useActionOverride } from "@/shared/lib/action-override";
import { getPushEndpoint } from "@/shared/lib/push/get-push-endpoint";
import { runServerAction } from "@/shared/lib/server-action/run-server-action";
import { showToast } from "@/shared/lib/toast";
import { cn } from "@/shared/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Spinner } from "@/shared/ui/spinner";

import { selectMember } from "../api/select-member";

type MemberSelectProps = {
  currentMemberId?: string;
  destination?: string;
  members: AccountMember[];
  onSelected?: () => void;
};

export function MemberSelect({ currentMemberId, destination, members, onSelected }: MemberSelectProps) {
  const selectMemberAction = useActionOverride(selectMember);

  const select = useMutation({
    mutationFn: async (memberId: string) => {
      const endpoint = await getPushEndpoint();
      return runServerAction(() => selectMemberAction({ destination, endpoint, memberId }));
    },
    onSuccess: (result, memberId) => {
      if (result?.status === "error") {
        return;
      }

      onSelected?.();
      const member = members.find(({ id }) => id === memberId);
      if (member) {
        showToast({ title: `${member.name}님으로 전환했어요`, variant: "success" });
      }
    },
  });

  // 전환은 서버 왕복 뒤 화면 이동까지 이어져서, 누른 타일에만 진행 중을 표시한다.
  const pendingMemberId = select.isPending ? select.variables : undefined;

  return (
    <div className="flex flex-1 flex-col gap-4">
      {select.data?.message || select.isError ? (
        <Alert variant="destructive">
          <WarningCircleIcon aria-hidden="true" />
          <AlertTitle>변경하지 못했어요</AlertTitle>
          <AlertDescription className="whitespace-pre-line">
            {select.data?.message ?? "사용자를 변경하지 못했습니다.\n잠시 후 다시 시도해 주세요."}
          </AlertDescription>
        </Alert>
      ) : null}

      <ul className="flex flex-col gap-2">
        {members.map((member) => {
          const selected = member.id === currentMemberId;
          return (
            <li key={member.id}>
              <button
                aria-label={selected ? `${member.name}, 현재 사용 중` : `${member.name}으로 전환`}
                aria-pressed={selected}
                aria-busy={pendingMemberId === member.id || undefined}
                className="flex min-h-20 w-full cursor-pointer items-center gap-4 rounded-2xl px-3 py-3 text-left hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-default"
                disabled={selected || select.isPending}
                onClick={() => select.mutate(member.id)}
                type="button"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-13 shrink-0 items-center justify-center rounded-2xl font-semibold text-xl",
                    getMemberAvatarTone(member.id),
                  )}
                >
                  {getMemberInitial(member.name)}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate font-semibold text-base">{member.name}</span>
                  {selected ? <span className="text-muted-foreground text-xs">현재 사용 중</span> : null}
                </span>
                {pendingMemberId === member.id ? (
                  <Spinner className="size-5 shrink-0 text-muted-foreground" />
                ) : selected ? (
                  <CheckIcon aria-hidden="true" className="shrink-0 text-primary" size={20} weight="bold" />
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
