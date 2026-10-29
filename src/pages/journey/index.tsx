import { requireMember } from "@/entities/member/server";

import { getJourneyRegions } from "./api/records";
import { JourneyMap } from "./ui/journey-map";

export async function JourneyPage() {
  const [{ supabase, user, member }, regions] = await Promise.all([requireMember(), getJourneyRegions()]);
  const { data: home, error } = await supabase
    .from("member_home_addresses")
    .select("member_id")
    .eq("owner_id", user.id)
    .eq("member_id", member.id)
    .maybeSingle();
  return (
    <JourneyMap
      regions={regions}
      hasHome={Boolean(home)}
      homeUnavailable={Boolean(error)}
      member={{ id: member.id, name: member.name }}
    />
  );
}
