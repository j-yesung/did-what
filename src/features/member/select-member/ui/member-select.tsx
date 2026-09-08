"use client";

import { CheckIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { type AccountMember, MEMBERS_QUERY_KEY } from "@/entities/member";
import { getPushEndpoint } from "@/shared/lib/push/get-push-endpoint";
import { runServerAction } from "@/shared/lib/server-action/run-server-action";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { ListRow, ListRowTexts } from "@/shared/ui/list-row";

import { selectMember } from "../api/select-member";

type MemberSelectProps = {
  currentMemberId?: string;
  destination?: string;
  members: AccountMember[];
};

export function MemberSelect({ currentMemberId, destination, members }: MemberSelectProps) {
  const queryClient = useQueryClient();
  const select = useMutation({
    mutationFn: async (memberId: string) => {
      const endpoint = await getPushEndpoint();
      return runServerAction(() => selectMember({ destination, endpoint, memberId }));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MEMBERS_QUERY_KEY }),
  });

  return (
    <div className="flex flex-col gap-4">
      {select.data?.message || select.isError ? (
        <Alert variant="destructive">
          <WarningCircleIcon aria-hidden="true" strokeWidth={2} />
          <AlertTitle>변경하지 못했어요</AlertTitle>
          <AlertDescription className="whitespace-pre-line">
            {select.data?.message ?? "사용자를 변경하지 못했습니다.\n잠시 후 다시 시도해 주세요."}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="-mx-5 flex flex-col">
        {members.map((member) => {
          const selected = member.id === currentMemberId;
          return (
            <ListRow
              aria-current={selected ? "true" : undefined}
              disabled={select.isPending}
              key={member.id}
              onClick={() => select.mutate(member.id)}
              right={selected ? <CheckIcon aria-hidden="true" className="text-primary" weight="bold" /> : null}
              type="button"
            >
              <ListRowTexts description={selected ? "현재 사용 중" : "이 사람으로 전환"} title={member.name} />
            </ListRow>
          );
        })}
      </div>
    </div>
  );
}
