"use client";

import type { FormEvent } from "react";
import { useActionState, useState } from "react";

import { CircleAlertIcon, MapPinnedIcon, SearchIcon } from "lucide-react";

import type { KakaoRegion } from "@/shared/api/kakao-local";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Spinner } from "@/shared/ui/spinner";

import { searchRecordRegions } from "../model/actions";
import { INITIAL_REGION_SEARCH_STATE } from "../model/location-picker";

type RegionPickerDialogProps = {
  onSelect: (region: KakaoRegion) => void;
};

export function RegionPickerDialog({ onSelect }: RegionPickerDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(searchRecordRegions, INITIAL_REGION_SEARCH_STATE);

  function stopPropagation(event: FormEvent<HTMLFormElement>) {
    event.stopPropagation();
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger render={<Button size="sm" type="button" variant="outline" />}>
        <SearchIcon aria-hidden="true" data-icon="inline-start" />
        지역 찾기
      </DialogTrigger>
      <DialogContent className="flex max-h-[min(640px,calc(100dvh-2rem))] flex-col overflow-hidden sm:max-w-md">
        <DialogHeader>
          <DialogTitle>어느 지역에 갔나요?</DialogTitle>
          <DialogDescription>동·읍·면 이름을 입력하고 정식 지역 목록에서 선택하세요.</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex gap-2" onSubmit={stopPropagation}>
          <Input aria-label="지역 이름" maxLength={100} name="query" placeholder="예: 망원" required />
          <Button disabled={pending} type="submit">
            {pending ? <Spinner aria-label="지역 검색 중" /> : <SearchIcon aria-hidden="true" />}
            <span className="sr-only">검색</span>
          </Button>
        </form>

        {state.status === "error" ? (
          <Alert variant="destructive">
            <CircleAlertIcon aria-hidden="true" />
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        ) : null}

        {state.status === "success" && state.regions?.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground text-sm">선택할 수 있는 지역이 없어요.</p>
        ) : null}

        {state.regions?.length ? (
          <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain pr-1">
            {state.regions.map((region) => (
              <li key={region.code}>
                <Button
                  className="h-auto w-full justify-start whitespace-normal px-3 py-3 text-left"
                  onClick={() => {
                    onSelect(region);
                    setOpen(false);
                  }}
                  type="button"
                  variant="outline"
                >
                  <MapPinnedIcon aria-hidden="true" data-icon="inline-start" />
                  {region.fullName}
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
