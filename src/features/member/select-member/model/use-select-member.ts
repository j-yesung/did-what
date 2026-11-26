"use client";

import { useMutation } from "@tanstack/react-query";

import type { AccountMember } from "@/entities/member";
import { useDemoOverride } from "@/shared/lib/demo-override";
import { getPushEndpoint } from "@/shared/lib/push/get-push-endpoint";
import { runServerAction } from "@/shared/lib/server-action/run-server-action";
import { showToast } from "@/shared/lib/toast";

import { selectMember } from "../api/select-member";

type UseSelectMemberOptions = {
  destination?: string;
  members: Pick<AccountMember, "id" | "name">[];
  onSelected?: () => void;
};

export const useSelectMember = ({ destination, members, onSelected }: UseSelectMemberOptions) => {
  const selectMemberAction = useDemoOverride(selectMember);

  return useMutation({
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
};
