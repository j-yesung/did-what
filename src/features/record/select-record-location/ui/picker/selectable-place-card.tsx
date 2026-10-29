import { type KeyboardEvent, useEffect, useRef } from "react";

import { PlaceIconTile } from "@/entities/place";
import type { PlaceClassification } from "@/entities/place/model/place-kind";
import { FOCUS_RING } from "@/shared/lib/interaction";
import { cn } from "@/shared/lib/utils";
import { CheckIcon, type CheckIconHandle } from "@/shared/ui/animated-icons";
import { Badge } from "@/shared/ui/badge";

type SelectablePlaceCardProps = {
  added: boolean;
  address: string;
  disabled: boolean;
  label?: string;
  name: string;
  place?: PlaceClassification;
  saved?: boolean;
  onSelect: () => void;
  /** 서버 확인 중에도 낙관적으로 선택한 체크 표시를 유지한다. */
  resolving?: boolean;
  selected: boolean;
};

export function SelectablePlaceCard({
  added,
  address,
  disabled,
  label,
  name,
  place,
  saved = false,
  onSelect,
  resolving = false,
  selected,
}: SelectablePlaceCardProps) {
  const checkRef = useRef<CheckIconHandle>(null);
  useEffect(() => {
    if (selected && !added && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      checkRef.current?.startAnimation();
    } else {
      checkRef.current?.stopAnimation();
    }
  }, [added, selected]);

  const select = () => {
    if (!disabled) onSelect();
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLLIElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    select();
  };

  return (
    <li
      aria-busy={resolving || undefined}
      aria-checked={added || selected}
      aria-disabled={disabled}
      className={cn(
        "group/location w-full min-w-0 border-border/70 border-b py-2",
        FOCUS_RING,
        disabled ? "cursor-default" : "cursor-pointer",
        // 눌러도 반응하지 않는 동안에는 흐리게 보여 말없이 무시되는 것처럼 보이지 않게 한다.
        disabled && !added && !resolving && "opacity-50",
      )}
      onClick={select}
      onKeyDown={handleKeyDown}
      role="checkbox"
      tabIndex={disabled ? -1 : 0}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={cn(
            "flex min-w-0 flex-1 origin-left items-center gap-3 transition-transform duration-200 motion-reduce:transition-none",
            !disabled && "group-active/location:scale-[0.99] motion-reduce:group-active/location:scale-100",
          )}
        >
          <PlaceIconTile className="size-11 rounded-xl [&_svg]:size-5" place={place ?? {}} />
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1.5">
              <p className="truncate font-medium text-sm">{name}</p>
              {saved ? <Badge className="shrink-0 px-1.5 py-0 text-[10px]">저장됨</Badge> : null}
            </div>
            <p className="mt-0.5 truncate text-muted-foreground text-xs">
              {label ? `${label} · ` : ""}
              {address}
            </p>
          </div>
        </div>
        {added ? (
          <Badge>추가됨</Badge>
        ) : (
          <CheckIcon
            aria-hidden="true"
            className={cn(
              "size-5 shrink-0 transition-colors duration-150",
              selected ? "text-accent-text" : "text-muted-foreground opacity-35",
            )}
            duration={0.7}
            isAnimated={false}
            ref={checkRef}
          />
        )}
      </div>
    </li>
  );
}
