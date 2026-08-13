"use client";

import type { FormEvent } from "react";
import { useActionState, useState, useTransition } from "react";

import { BookmarkCheckIcon, BookmarkIcon, CircleAlertIcon, MapPinIcon, PlusIcon, SearchIcon } from "lucide-react";

import type { PlaceOption } from "@/entities/place";
import type { KakaoPlace } from "@/shared/api/kakao-local";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";

import { resolveRecordPlace, searchRecordPlaces } from "../model/actions";
import {
  INITIAL_PLACE_SEARCH_STATE,
  type RecordLocationPlace,
  type RecordLocationRegion,
} from "../model/location-picker";

type PlacePickerPanelProps = {
  onAdd: (place: RecordLocationPlace, region: RecordLocationRegion) => void;
  region: RecordLocationRegion | null;
  savedPlaces: PlaceOption[];
  selectedKeys: Set<string>;
};

/** 다이얼로그가 닫히면 이 패널이 통째로 언마운트되면서 검색어와 결과도 함께 사라진다. */
function PlacePickerPanel({ onAdd, region, savedPlaces, selectedKeys }: PlacePickerPanelProps) {
  const [selectionError, setSelectionError] = useState<string>();
  const [selecting, startSelecting] = useTransition();
  const [state, formAction, pending] = useActionState(searchRecordPlaces, INITIAL_PLACE_SEARCH_STATE);

  // 저장해 둔 장소는 선택한 지역 안에 있을 때만 검색 없이 바로 고를 수 있다.
  const savedInRegion = region ? savedPlaces.filter((place) => place.region_code === region.code) : [];

  function stopPropagation(event: FormEvent<HTMLFormElement>) {
    event.stopPropagation();
    setSelectionError(undefined);
  }

  function addSavedPlace(place: PlaceOption) {
    if (!region) return;

    onAdd(
      {
        address: place.address,
        key: `existing:${place.id}`,
        name: place.name,
        reference: { kind: "existing", placeId: place.id, save: false },
        saved: true,
      },
      region,
    );
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
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>방문 장소 찾기</DialogTitle>
        <DialogDescription>
          {region ? `${region.fullName} 안에서 방문한 곳을 찾아보세요.` : "첫 장소를 고르면 해당 지역이 자동 선택돼요."}
        </DialogDescription>
      </DialogHeader>

      {savedInRegion.length ? (
        <section aria-labelledby="saved-place-quick-add" className="flex flex-col gap-2">
          <h3
            className="flex items-center gap-1.5 px-0.5 font-[650] text-muted-foreground text-xs"
            id="saved-place-quick-add"
          >
            <BookmarkIcon className="size-3.5 text-foreground" aria-hidden="true" />내 장소에서 바로 추가
          </h3>
          <ul className="flex max-h-[92px] flex-wrap gap-1.5 overflow-y-auto overscroll-contain">
            {savedInRegion.map((place) => {
              const added = selectedKeys.has(`existing:${place.id}`);

              return (
                <li key={place.id}>
                  <Button
                    className="rounded-lg"
                    disabled={added || selecting}
                    onClick={() => addSavedPlace(place)}
                    size="sm"
                    type="button"
                    variant={added ? "secondary" : "outline"}
                  >
                    {added ? (
                      <BookmarkCheckIcon aria-hidden="true" data-icon="inline-start" />
                    ) : (
                      <PlusIcon aria-hidden="true" data-icon="inline-start" />
                    )}
                    {place.name}
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <form action={formAction} className="flex gap-2" onSubmit={stopPropagation}>
        <input name="page" type="hidden" value="1" />
        <input name="regionName" type="hidden" value={region?.fullName ?? ""} />
        <Input aria-label="방문 장소 이름" maxLength={100} name="query" placeholder="예: 메가커피" required />
        <Button disabled={selecting} loading={pending} type="submit">
          <SearchIcon aria-hidden="true" />
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
                    className="mt-0.5 size-[18px] shrink-0 text-foreground [stroke-width:2]"
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
                  disabled={selected}
                  loading={selecting}
                  onClick={() => selectPlace(place)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <PlusIcon aria-hidden="true" />
                  {selected ? "추가됨" : "방문 장소에 추가"}
                </Button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </>
  );
}

type PlacePickerDialogProps = {
  disabled?: boolean;
  onAdd: (place: RecordLocationPlace, region: RecordLocationRegion) => void;
  region: RecordLocationRegion | null;
  savedPlaces: PlaceOption[];
  selectedKeys: Set<string>;
};

export function PlacePickerDialog({ disabled, onAdd, region, savedPlaces, selectedKeys }: PlacePickerDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger
        disabled={disabled}
        render={<Button disabled={disabled} size="sm" type="button" variant="outline" />}
      >
        <PlusIcon aria-hidden="true" data-icon="inline-start" />
        방문 장소 추가
      </DialogTrigger>
      <DialogContent className="flex max-h-[min(680px,calc(100dvh-2rem-env(safe-area-inset-top)-env(safe-area-inset-bottom)))] flex-col overflow-hidden sm:max-w-md">
        <PlacePickerPanel
          onAdd={(place, placeRegion) => {
            onAdd(place, placeRegion);
            setOpen(false);
          }}
          region={region}
          savedPlaces={savedPlaces}
          selectedKeys={selectedKeys}
        />
      </DialogContent>
    </Dialog>
  );
}
