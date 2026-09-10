"use client";

import { Button } from "@/shared/ui/button";
import { FieldLegend, FieldSet } from "@/shared/ui/field";
import { PressLink } from "@/shared/ui/press-link";

export function CurrentMemberSetting({ name }: { name: string }) {
  return (
    <FieldSet className="gap-2">
      <FieldLegend>현재 사용자</FieldLegend>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-base">{name}</p>
        </div>
        <Button
          nativeButton={false}
          render={<PressLink href="/members/select?returnTo=/settings" />}
          size="medium"
          variant="outline"
        >
          전환
        </Button>
      </div>
    </FieldSet>
  );
}
