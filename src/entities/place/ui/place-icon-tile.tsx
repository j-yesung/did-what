import {
  CameraIcon,
  CoffeeIcon,
  ForkKnifeIcon,
  MapPinIcon,
  ShoppingBagIcon,
  TicketIcon,
  TreeIcon,
} from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/shared/lib/utils";

import { getPlaceKind, type PlaceClassification, type PlaceKind } from "../model/place-kind";

const PLACE_ICONS = {
  cafe: CoffeeIcon,
  restaurant: ForkKnifeIcon,
  park: TreeIcon,
  attraction: CameraIcon,
  culture: TicketIcon,
  shopping: ShoppingBagIcon,
  other: MapPinIcon,
};
const PLACE_COLORS: Record<PlaceKind, string> = {
  cafe: "bg-secondary text-primary",
  restaurant: "bg-category-date/8 text-category-date",
  park: "bg-category-daily/8 text-category-daily",
  attraction: "bg-place-attraction/8 text-place-attraction",
  culture: "bg-category-anniversary/8 text-category-anniversary",
  shopping: "bg-category-gathering/8 text-category-gathering",
  other: "bg-muted text-muted-foreground",
};

export function PlaceIconTile({ className, place }: { className?: string; place: PlaceClassification }) {
  const kind = getPlaceKind(place);
  const Icon = PLACE_ICONS[kind];
  return (
    <span
      aria-hidden="true"
      className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl", PLACE_COLORS[kind], className)}
    >
      <Icon className="size-5" />
    </span>
  );
}
