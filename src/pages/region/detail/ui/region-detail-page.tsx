import { notFound } from "next/navigation";

import { getRegion } from "@/entities/region";
import { requireUser } from "@/shared/api/supabase/require-user";

import { RegionDetailContent } from "./region-detail-content";

type RegionDetailPageProps = {
  params: Promise<{ regionCode: string }>;
};

export async function RegionDetailPage({ params }: RegionDetailPageProps) {
  const [{ regionCode }] = await Promise.all([params, requireUser()]);
  const region = getRegion(regionCode);

  if (!region) notFound();

  return <RegionDetailContent region={region} />;
}
