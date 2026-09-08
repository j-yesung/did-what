"use client";

import { WarningCircleIcon } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { type AccountMember, MEMBERS_QUERY_KEY } from "@/entities/member";
import { FOCUS_RING, PRESS_FEEDBACK } from "@/shared/lib/interaction";
import { getPushEndpoint } from "@/shared/lib/push/get-push-endpoint";
import { runServerAction } from "@/shared/lib/server-action/run-server-action";
import { cn } from "@/shared/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Spinner } from "@/shared/ui/spinner";

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
  // 전환은 서버 왕복 뒤 화면 이동까지 이어져서, 누른 타일에만 진행 중을 표시한다.
  const pendingMemberId = select.isPending ? select.variables : undefined;

  return (
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

      {/* 한 줄에 3개. grid와 달리 2명일 때도 왼쪽으로 몰리지 않고 가운데 정렬된다. */}
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-5">
        {members.map((member) => {
          const selected = member.id === currentMemberId;
          return (
            <li className="w-[calc((100%-2rem)/3)]" key={member.id}>
              <button
                aria-current={selected ? "true" : undefined}
                className={cn(
                  PRESS_FEEDBACK,
                  FOCUS_RING,
                  "flex w-full cursor-pointer flex-col items-center gap-2 rounded-xl after:inset-0 disabled:cursor-default",
                )}
                disabled={select.isPending}
                onClick={() => select.mutate(member.id)}
                type="button"
              >
                <span className="relative block w-full overflow-hidden rounded-xl bg-muted">
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
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
