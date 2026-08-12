"use client";

import type { FormEvent } from "react";
import { useActionState, useState, useTransition } from "react";

import { CircleAlertIcon, MapPinIcon, PlusIcon, SearchIcon } from "lucide-react";

import type { KakaoPlace, KakaoRegion } from "@/shared/api/kakao-local";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Spinner } from "@/shared/ui/spinner";

import { resolveRecordPlace, searchRecordPlaces } from "../model/actions";
import { INITIAL_PLACE_SEARCH_STATE, type RecordLocationPlace } from "../model/location-picker";

type PlacePickerDialogProps = {
  disabled?: boolean;
  onAdd: (place: RecordLocationPlace, region: KakaoRegion) => void;
  region: KakaoRegion | null;
  selectedKeys: Set<string>;
};

export function PlacePickerDialog({ disabled, onAdd, region, selectedKeys }: PlacePickerDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectionError, setSelectionError] = useState<string>();
  const [selecting, startSelecting] = useTransition();
  const [state, formAction, pending] = useActionState(searchRecordPlaces, INITIAL_PLACE_SEARCH_STATE);

  function stopPropagation(event: FormEvent<HTMLFormElement>) {
    event.stopPropagation();
    setSelectionError(undefined);
  }

  function selectPlace(place: KakaoPlace) {
    if (!state.query || !state.page) return;

    startSelecting(async () => {
      const result = await resolveRecordPlace({
        expectedRegionCode: region?.code,
        page: state.page ?? 1,
        providerPlaceId: place.id,
        query: state.query ?? "",
      });
      if ("error" in result) {
        setSelectionError(result.error);
        return;
      }

      onAdd(result.place, result.region);
      setSelectionError(undefined);
      setOpen(false);
    });
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger
        disabled={disabled}
        render={<Button disabled={disabled} size="sm" type="button" variant="outline" />}
      >
        <PlusIcon aria-hidden="true" data-icon="inline-start" />
        방문 장소 추가
      </DialogTrigger>
      <DialogContent className="flex max-h-[min(680px,calc(100dvh-2rem))] flex-col overflow-hidden sm:max-w-md">
        <DialogHeader>
          <DialogTitle>방문 장소 찾기</DialogTitle>
          <DialogDescription>
            {region
              ? `${region.fullName} 안에서 방문한 곳을 찾아보세요.`
              : "첫 장소를 고르면 해당 지역이 자동 선택돼요."}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex gap-2" onSubmit={stopPropagation}>
          <input name="page" type="hidden" value="1" />
          <input name="regionName" type="hidden" value={region?.fullName ?? ""} />
          <Input aria-label="방문 장소 이름" maxLength={100} name="query" placeholder="예: 메가커피" required />
          <Button disabled={pending || selecting} type="submit">
            {pending ? <Spinner aria-label="장소 검색 중" /> : <SearchIcon aria-hidden="true" />}
            <span className="sr-only">검색</span>
          </Button>
        </form>

        {state.status === "error" || selectionError ? (
          <Alert variant="destructive">
            <CircleAlertIcon aria-hidden="true" />
            <AlertDescription>{selectionError ?? state.message}</AlertDescription>
          </Alert>
        ) : null}

        {state.status === "success" && state.places?.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground text-sm">검색 결과가 없어요.</p>
        ) : null}

        {state.places?.length ? (
          <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain pr-1">
            {state.places.map((place) => {
              const selected = selectedKeys.has(`kakao:${place.id}`);
              return (
                <li className="rounded-xl border bg-card p-3" key={place.id}>
                  <div className="flex items-start gap-3">
                    <MapPinIcon
                      className="mt-0.5 size-[18px] shrink-0 text-primary [stroke-width:2]"
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">{place.name}</p>
                      <p className="mt-1 text-muted-foreground text-xs leading-relaxed">
                        {place.address ?? "주소 정보 없음"}
                      </p>
                    </div>
                  </div>
                  <Button
                    className="mt-3 w-full"
                    disabled={selected || selecting}
                    onClick={() => selectPlace(place)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    {selecting ? <Spinner aria-label="장소 확인 중" /> : <PlusIcon aria-hidden="true" />}
                    {selected ? "추가됨" : "방문 장소에 추가"}
                  </Button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
