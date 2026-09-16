"use client";

import { NotePencilIcon } from "@phosphor-icons/react";

import { IconButton } from "@/shared/ui/icon-button";
import { PressLink } from "@/shared/ui/press-link";

export function RecordCreateButton() {
  return (
    <IconButton
      aria-label="기록 남기기"
      className="rounded-full text-foreground"
      icon={NotePencilIcon}
      iconSize={22}
      nativeButton={false}
      render={<PressLink href="/records/new" prefetch />}
      variant="clear"
    />
  );
}
