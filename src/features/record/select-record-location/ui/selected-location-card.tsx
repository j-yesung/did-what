import type { ReactNode } from "react";

import { XIcon } from "@phosphor-icons/react";

import { IconButton } from "@/shared/ui/icon-button";

type SelectedLocationCardProps = {
  name: string;
  description: string;
  icon: ReactNode;
  removeLabel: string;
  onRemove: () => void;
};

export function SelectedLocationCard({ name, description, icon, removeLabel, onRemove }: SelectedLocationCardProps) {
  return (
    <li className="rounded-xl border bg-card px-3 py-2">
      <div className="flex min-h-11 items-center gap-3">
        {icon}
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 break-words font-medium text-sm">{name}</p>
          <p className="mt-0.5 truncate text-muted-foreground text-xs">{description}</p>
        </div>
        <IconButton aria-label={removeLabel} icon={XIcon} iconSize={18} onClick={onRemove} type="button" />
      </div>
    </li>
  );
}
