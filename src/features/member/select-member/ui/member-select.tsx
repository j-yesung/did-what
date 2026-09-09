"use client";

import { useState } from "react";

import { UserRoundIcon } from "@animateicons/react/lucide";
import { WarningCircleIcon } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { type AccountMember, MEMBERS_QUERY_KEY } from "@/entities/member";
import { showNotice } from "@/shared/lib/notice";
import { getPushEndpoint } from "@/shared/lib/push/get-push-endpoint";
import { runServerAction } from "@/shared/lib/server-action/run-server-action";
import { cn } from "@/shared/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog, ConfirmDialogCancelButton } from "@/shared/ui/confirm-dialog";
import { Spinner } from "@/shared/ui/spinner";

import { selectMember } from "../api/select-member";

type MemberSelectProps = {
  currentMemberId?: string;
  destination?: string;
  members: AccountMember[];
};

export function MemberSelect({ currentMemberId, destination, members }: MemberSelectProps) {
  const [selectedMember, setSelectedMember] = useState<AccountMember>();

  const queryClient = useQueryClient();

  const select = useMutation({
    mutationFn: async (memberId: string) => {
      const endpoint = await getPushEndpoint();
      return runServerAction(() => selectMember({ destination, endpoint, memberId }));
    },
    onError: () => setSelectedMember(undefined),
    onSuccess: async (result, memberId) => {
      if (result?.status === "error") {
        setSelectedMember(undefined);
        return;
      }

      const member = members.find(({ id }) => id === memberId);
      if (member) {
        showNotice({ icon: UserRoundIcon, title: `${member.name}님으로 전환했어요`, variant: "success" });
      }

      await queryClient.invalidateQueries({ queryKey: MEMBERS_QUERY_KEY });
    },
  });

  // 전환은 서버 왕복 뒤 화면 이동까지 이어져서, 누른 타일에만 진행 중을 표시한다.
  const pendingMemberId = select.isPending ? select.variables : undefined;

  return (
    <>
      <div className="flex flex-1 flex-col justify-center gap-8 py-4">
        {select.data?.message || select.isError ? (
          <Alert variant="destructive">
            <WarningCircleIcon aria-hidden="true" strokeWidth={2} />
            <AlertTitle>변경하지 못했어요</AlertTitle>
            <AlertDescription className="whitespace-pre-line">
              {select.data?.message ?? "사용자를 변경하지 못했습니다.\n잠시 후 다시 시도해 주세요."}
            </AlertDescription>
          </Alert>
        ) : null}

        <ul className="mx-auto grid w-full max-w-56 grid-cols-2 gap-x-4 gap-y-5">
          {members.map((member) => {
            const selected = member.id === currentMemberId;
            return (
              <li className="flex min-w-0 flex-col items-center gap-2" key={member.id}>
                <Button
                  aria-label={selected ? `${member.name}, 현재 사용 중` : `${member.name} 선택`}
                  aria-current={selected ? "true" : undefined}
                  className="h-auto rounded-xl p-0 disabled:opacity-100 [&>span]:w-full"
                  disabled={selected || select.isPending}
                  fullWidth
                  onClick={() => setSelectedMember(member)}
                  type="button"
                  variant="ghost"
                >
                  <span className="relative block w-full overflow-hidden rounded-xl bg-card">
                    <img
                      alt=""
                      className={cn(
                        "block aspect-square w-full object-cover transition-opacity",
                        select.isPending && pendingMemberId !== member.id && "opacity-40",
                      )}
                      src="/member-avatar.svg"
                    />
                    {selected ? (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-primary ring-inset"
                      />
                    ) : null}
                    {pendingMemberId === member.id ? (
                      <span className="absolute inset-0 flex items-center justify-center bg-dimmed">
                        <Spinner className="text-light" />
                      </span>
                    ) : null}
                  </span>
                </Button>
                <span className="flex w-full flex-col items-center gap-0.5">
                  <span
                    className={cn(
                      "w-full truncate text-center font-medium text-sm",
                      selected ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {member.name}
                  </span>
                  {selected ? <span className="text-primary text-xs">현재 사용 중</span> : null}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* 선택 확인 다이얼로그 */}
      <ConfirmDialog
        title={`${selectedMember?.name ?? "선택한 사용자"}님으로 사용할까요?`}
        description="알림을 확인할 사용자로 선택해요."
        cancelButton={
          <ConfirmDialogCancelButton disabled={select.isPending} onClick={() => setSelectedMember(undefined)}>
            취소
          </ConfirmDialogCancelButton>
        }
        confirmButton={
          <Button
            loading={select.isPending}
            onClick={() => selectedMember && select.mutate(selectedMember.id)}
            variant="fill"
          >
            선택
          </Button>
        }
        onClose={() => {
          if (!select.isPending) setSelectedMember(undefined);
        }}
        open={selectedMember !== undefined}
      />
    </>
  );
}
