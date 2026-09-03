import { notFound } from "next/navigation";

import { getRecordLocations, getRegionRecords } from "@/entities/record/server";
import { getRegion } from "@/entities/region";
import { requireUser } from "@/shared/api/supabase/require-user";

import { RegionDetailContent } from "./ui/region-detail-content";

type RegionDetailPageProps = {
  params: Promise<{ regionCode: string }>;
};

export async function RegionDetailPage({ params }: RegionDetailPageProps) {
  const [{ regionCode }, { user }] = await Promise.all([params, requireUser()]);
  const region = getRegion(regionCode);

  if (!region) notFound();

  const [initialLocations, initialRecords] = await Promise.all([
    getRecordLocations(user.id),
    getRegionRecords(region, user.id),
  ]);

  return <RegionDetailContent initialLocations={initialLocations} initialRecords={initialRecords} region={region} />;
}
