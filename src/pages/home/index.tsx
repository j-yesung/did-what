import { requireMember } from "@/entities/member/server";

import { HomeContent } from "./ui/home-content";

export async function HomePage() {
  const { member } = await requireMember();
  return <HomeContent member={{ id: member.id, name: member.name }} />;
}
