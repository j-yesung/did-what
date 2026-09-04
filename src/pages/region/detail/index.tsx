import { notFound } from "next/navigation";

import { getRegion } from "@/entities/region";

import { RegionDetailContent } from "./ui/region-detail-content";

type RegionDetailPageProps = {
  params: Promise<{ regionCode: string }>;
};

export async function RegionDetailPage({ params }: RegionDetailPageProps) {
  const { regionCode } = await params;
  const region = getRegion(regionCode);

  if (!region) notFound();

  return <RegionDetailContent region={region} />;
}
