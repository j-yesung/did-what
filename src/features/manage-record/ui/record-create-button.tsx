"use client";

import { NotePencilIcon } from "@phosphor-icons/react";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/shared/ui/button";

const CREATE_BUTTON_PATHS = new Set(["/", "/records", "/regions", "/places"]);

export function RecordCreateButton() {
  const pathname = usePathname();
  const router = useRouter();

  if (!pathname || !CREATE_BUTTON_PATHS.has(pathname)) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--nav-height)+var(--nav-bottom-offset)+12px)] z-30">
      <div className="mx-auto flex w-full max-w-(--app-width) justify-end px-5">
        <Button
          aria-label="기록 남기기"
          className="pointer-events-auto size-12 min-w-0 rounded-full p-0 shadow-(--shadow-notice)"
          onClick={() => router.push("/records/new")}
          size="large"
          type="button"
        >
          <NotePencilIcon aria-hidden="true" strokeWidth={2} />
        </Button>
      </div>
    </div>
  );
}
