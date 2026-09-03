"use client";

import { NotePencilIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/shared/ui/button";

const CREATE_BUTTON_PATHS = new Set(["/", "/records", "/regions", "/places"]);

export function RecordCreateButton() {
  const pathname = usePathname();

  if (!pathname || !CREATE_BUTTON_PATHS.has(pathname)) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--nav-height)+var(--nav-bottom-offset)+12px)] z-30">
      <div className="mx-auto flex w-full max-w-(--app-width) justify-end px-5">
        <Button
          aria-label="기록 남기기"
          className="pointer-events-auto size-14 min-w-0 rounded-full p-0 shadow-(--shadow-notice)"
          nativeButton={false}
          render={<Link href="/records/new" prefetch />}
          size="large"
        >
          <NotePencilIcon aria-hidden="true" className="size-6" strokeWidth={2} />
        </Button>
      </div>
    </div>
  );
}
