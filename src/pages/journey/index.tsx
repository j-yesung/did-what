import { getMemberHomeAddress, requireMember } from "@/entities/member/server";

import { getJourneyMap } from "./api/records";
import { JourneyMap } from "./ui/journey-map";

export async function JourneyPage() {
  const [{ member }, { regions, visits }, { data: home, error }] = await Promise.all([
    requireMember(),
    getJourneyMap(),
    getMemberHomeAddress(),
  ]);
  return (
    <JourneyMap
      regions={regions}
      visits={visits}
      hasHome={Boolean(home)}
      homeVersion={home?.updated_at ?? null}
      homeUnavailable={Boolean(error)}
      member={{ id: member.id, name: member.name }}
    />
  );
}
