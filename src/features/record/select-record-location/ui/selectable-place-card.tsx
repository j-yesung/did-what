import type { KeyboardEvent } from "react";

import { FOCUS_RING } from "@/shared/lib/interaction";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";

type SelectablePlaceCardProps = {
  added: boolean;
  address: string;
  checkboxDisabled: boolean;
  disabled: boolean;
  label?: string;
  name: string;
  onSelect: () => void;
  selected: boolean;
};

export function SelectablePlaceCard({
  added,
  address,
  checkboxDisabled,
  disabled,
  label,
  name,
  onSelect,
  selected,
}: SelectablePlaceCardProps) {
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
      aria-checked={added || selected}
      aria-disabled={disabled}
      className={cn(
        "w-full min-w-0 rounded-xl transition-transform duration-200 active:scale-[0.99]",
        FOCUS_RING,
        disabled ? "cursor-default" : "cursor-pointer",
      )}
      onClick={select}
      onKeyDown={handleKeyDown}
      role="checkbox"
      tabIndex={disabled ? -1 : 0}
    >
      <Card
        className={cn(
          "w-full min-w-0 transition-[background-color,box-shadow] duration-200",
          selected && "bg-secondary ring-2 ring-primary/40 dark:bg-pressed dark:ring-foreground/15",
        )}
        data-selected={selected}
        size="sm"
      >
        <CardHeader className="min-w-0 grid-cols-[minmax(0,1fr)_auto]">
          <CardTitle className="min-w-0 truncate">{name}</CardTitle>
          {label ? <CardDescription>{label}</CardDescription> : null}
          <CardAction>
            {added ? (
              <Badge>추가됨</Badge>
            ) : (
              <Checkbox
                aria-hidden="true"
                checked={selected}
                className="pointer-events-none size-6"
                disabled={checkboxDisabled}
                tabIndex={-1}
                variant="circle"
              />
            )}
          </CardAction>
        </CardHeader>
        <CardContent>
          <p className="wrap-break-word text-muted-foreground text-sm">{address}</p>
        </CardContent>
      </Card>
    </li>
  );
}
