"use client";

import { NotePencilIcon } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";

import { IconButton } from "@/shared/ui/icon-button";
import { PressLink } from "@/shared/ui/press-link";

const RECORD_CREATE_ENTRY_PATHS = new Set(["/", "/regions", "/records", "/places", "/settings"]);

export function RecordCreateButton() {
  const pathname = usePathname() ?? "";

  if (!RECORD_CREATE_ENTRY_PATHS.has(pathname)) return null;

  return (
    <IconButton
      aria-label="기록 남기기"
      className="liquid-glass size-13 rounded-full"
      icon={NotePencilIcon}
      iconSize={24}
      nativeButton={false}
      render={<PressLink href="/records/new" prefetch />}
      size="lg"
      variant="clear"
    />
  );
}
