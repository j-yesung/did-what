import { getPlaceRegionLabel, PlaceGridItemContent, type PlaceOption } from "@/entities/place";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { buttonVariants } from "@/shared/ui/button";

type SelectablePlaceGridItemProps = {
  added: boolean;
  disabled: boolean;
  onSelect: () => void;
  place: PlaceOption;
  selected: boolean;
};

export function SelectablePlaceGridItem({ added, disabled, onSelect, place, selected }: SelectablePlaceGridItemProps) {
  return (
    <li className="min-w-0">
      <button
        aria-pressed={added || selected}
        aria-label={`${place.name}, ${getPlaceRegionLabel(place.region_name, place.address)}${place.address ? `, ${place.address}` : ""}${added ? ", 추가됨" : ""}`}
        className={cn(
          buttonVariants({ fullWidth: true, variant: "ghost" }),
          "h-auto min-w-0 flex-col whitespace-normal rounded-2xl border-2 p-1 after:hidden",
        )}
        data-selected={selected}
        disabled={disabled}
        onClick={onSelect}
        title={place.address ?? undefined}
        type="button"
      >
        <PlaceGridItemContent
          badge={
            added ? <Badge className="absolute top-1 right-1 rounded-md px-1 py-0 text-[10px]">추가됨</Badge> : null
          }
          place={place}
          selected={selected}
        />
      </button>
    </li>
  );
}
