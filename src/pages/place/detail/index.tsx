import { notFound } from "next/navigation";

import { isUuid } from "@/shared/lib/validation/is-uuid";

import { PlaceDetailContent } from "./ui/place-detail-content";

type PlaceDetailPageProps = {
  params: Promise<{ placeId: string }>;
};

export async function PlaceDetailPage({ params }: PlaceDetailPageProps) {
  const { placeId } = await params;

  if (!isUuid(placeId)) {
    notFound();
  }

  return <PlaceDetailContent placeId={placeId} />;
}
