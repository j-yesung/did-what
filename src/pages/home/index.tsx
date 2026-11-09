import { requireMember } from "@/entities/member/server";
import { getMetOn } from "@/features/met-on/api/met-on";
import { getToday } from "@/shared/lib/date/get-today";

import { getHomeRecords } from "./api/records";
import { HomeDashboard } from "./ui/home-dashboard";

export async function HomePage() {
  const [{ member }, records, metOn] = await Promise.all([requireMember(), getHomeRecords(), getMetOn()]);

  return <HomeDashboard member={{ name: member.name }} metOn={metOn} records={records} today={getToday()} />;
}
