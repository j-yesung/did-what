import { requireMember } from "@/entities/member/server";
import { QueryProvider } from "@/shared/lib/react-query/query-provider";

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
    <QueryProvider>
      <JourneyMap regions={regions} hasHome={Boolean(home)} homeUnavailable={Boolean(error)} memberId={member.id} />
    </QueryProvider>
  );
}
