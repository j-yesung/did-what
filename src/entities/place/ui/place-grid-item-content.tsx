import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

import { getPlaceRegionLabel } from "../model/get-place-region-label";
import type { PlaceClassification } from "../model/place-kind";
import { PlaceIconTile } from "./place-icon-tile";

type PlaceGridItemContentProps = {
  badge?: ReactNode;
  place: PlaceClassification & { address: string | null; name: string; region_name: string | null };
  selected?: boolean;
};

export function PlaceGridItemContent({ badge, place, selected }: PlaceGridItemContentProps) {
  return (
    <span className="flex w-full min-w-0 flex-col items-center gap-2.5">
      <span aria-hidden="true" className="relative block size-11 shrink-0">
        <PlaceIconTile
          className={cn(
            "size-full rounded-2xl [&_svg]:size-5.5",
            selected !== undefined && "border-2 border-transparent",
            selected && "border-accent-text",
          )}
          place={place}
        />
        {badge}
      </span>
      <span className="flex w-full min-w-0 flex-col gap-0.5 text-center">
        <span className="line-clamp-2 break-words font-semibold text-[13px] leading-4.75">{place.name}</span>
        <span className="w-full truncate text-[11px] text-muted-foreground leading-4">
          {getPlaceRegionLabel(place.region_name, place.address)}
        </span>
      </span>
    </span>
  );
}
