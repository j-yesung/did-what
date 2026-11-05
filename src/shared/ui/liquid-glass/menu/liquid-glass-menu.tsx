"use client";

import { CheckIcon, DotsThreeIcon, type Icon } from "@phosphor-icons/react";
import { Menu } from "glisse";

import { cn } from "@/shared/lib/utils";
import { PressLink } from "@/shared/ui/press-link";

import "./liquid-glass-menu.css";

type LiquidGlassMenuAction = {
  label: string;
  icon?: Icon;
  description?: string;
  selected?: boolean;
  href?: string;
  onSelect?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  className?: string;
};

type LiquidGlassMenuProps = {
  actions: LiquidGlassMenuAction[];
  label: string;
  icon?: Icon;
  align?: "start" | "end";
  triggerLabel?: string;
};

export function LiquidGlassMenu({
  actions,
  label,
  icon: TriggerIcon = DotsThreeIcon,
  align = "end",
  triggerLabel = label,
}: LiquidGlassMenuProps) {
  return (
    <Menu
      align={align}
      aria-label={triggerLabel}
      className="liquid-glass-menu"
      icon={<TriggerIcon aria-hidden="true" />}
      items={actions.map(({ icon: ActionIcon, ...action }) => ({
        href: action.href,
        selected: action.selected,
        disabled: action.disabled,
        destructive: action.destructive,
        onSelect: action.onSelect,
        icon: ActionIcon ? <ActionIcon aria-hidden="true" /> : undefined,
        label: (
          <span className={cn("flex min-w-0 flex-1 items-center gap-2", action.className)}>
            <span className="min-w-0 flex-1 truncate">{action.label}</span>
            {action.description && (
              <span className="shrink-0 whitespace-nowrap text-muted-foreground text-xs">{action.description}</span>
            )}
            {action.selected && <CheckIcon aria-hidden="true" className="size-4 shrink-0" />}
          </span>
        ),
      }))}
      link={PressLink}
    />
  );
}
