"use server";

import { redirect } from "next/navigation";

import { getAccountMembers, setCurrentMember } from "@/entities/member/server";
import { reassignPushSubscription } from "@/features/push-notification/server";
import { requireUser } from "@/shared/api/supabase/require-user";

import { normalizeMemberNames, validateMemberNames } from "../model/member-setup";

export type SetupMembersState = { message: string; status: "error" };

export async function setupMembers(formData: FormData): Promise<SetupMembersState> {
  const names = normalizeMemberNames(formData.getAll("memberName").map(String));
  const endpoint = String(formData.get("endpoint") ?? "") || null;
  const selectedIndex = Number(formData.get("currentMemberIndex"));
  const validationMessage = validateMemberNames(names);

  if (validationMessage) return { message: validationMessage, status: "error" };
  if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= names.length) {
    return { message: "이 기기에서 사용할 사람을 선택해 주세요.", status: "error" };
  }

  const { supabase, user } = await requireUser();
  const { data: created, error } = await supabase.rpc("setup_account_members", { p_names: names });
  if (error || !created) {
    return { message: "구성원을 등록하지 못했습니다.\n잠시 후 다시 시도해 주세요.", status: "error" };
  }

  const members = await getAccountMembers(supabase, user.id);
  const selectedMember = members.find((member) => member.name === names[selectedIndex]);
  if (!selectedMember) {
    return { message: "현재 사용자를 확인하지 못했습니다.\n다시 선택해 주세요.", status: "error" };
  }

  // 구성원 설정 전부터 켜져 있던 푸시가 있으면 선택한 사람에게 연결한다. 실패해도 최초 설정은 완료한다.
  await reassignPushSubscription({ endpoint, memberId: selectedMember.id, ownerId: user.id, supabase });
  await setCurrentMember(selectedMember.id);
  redirect("/");
}
