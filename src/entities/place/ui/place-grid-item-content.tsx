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
    <span className="flex w-full min-w-0 flex-col items-center gap-1.5">
      <span aria-hidden="true" className="relative block w-[84%]">
        <PlaceIconTile
          className={cn(
            "aspect-square size-auto w-full rounded-2xl [&_svg]:size-6.5",
            selected !== undefined && "border-2 border-transparent",
            selected && "border-accent-text",
          )}
          place={place}
        />
        {badge}
      </span>
      <span className="flex w-full min-w-0 flex-col gap-0.5 text-center">
        <span className="line-clamp-2 font-semibold text-[11px] leading-3.5">{place.name}</span>
        <span className="w-full truncate text-[10px] text-muted-foreground leading-3">
          {getPlaceRegionLabel(place.region_name, place.address)}
        </span>
      </span>
    </span>
  );
}
