"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/shared/ui/button";
import { FieldDescription, FieldLegend, FieldSet } from "@/shared/ui/field";

export function CurrentMemberSetting({ name }: { name: string }) {
  const router = useRouter();

  return (
    <FieldSet className="gap-2">
      <FieldLegend>현재 사용자</FieldLegend>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-base">{name}</p>
          <FieldDescription>이 기기에서 기록을 남기는 사람이에요.</FieldDescription>
        </div>
        <Button
          onClick={() => router.push("/members/select?returnTo=/settings")}
          size="medium"
          type="button"
          variant="outline"
        >
          전환
        </Button>
      </div>
    </FieldSet>
  );
}
