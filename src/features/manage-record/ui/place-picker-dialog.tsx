"use client";

import { type FormEvent, useState } from "react";

import { BookmarkIcon, MapPinIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";

import type { PlaceOption } from "@/entities/place";
import { usePlaceSearch } from "@/entities/place/api/search-queries";
import { getErrorMessage } from "@/shared/api/http/get-error-message";
import type { KakaoPlace } from "@/shared/api/kakao-local";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerVirtualKeyboardProvider,
} from "@/shared/ui/drawer";
import { Field, FieldGroup } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";

import { resolveRecordPlace } from "../model/actions";
import type { RecordLocationPlace, RecordLocationRegion } from "../model/location-picker";

type PlacePickerPanelProps = {
  onAdd: (place: RecordLocationPlace, region: RecordLocationRegion) => void;
  region: RecordLocationRegion | null;
  savedPlaces: PlaceOption[];
  selectedKeys: Set<string>;
};

/** 시트가 닫히면 이 패널이 통째로 언마운트되면서 검색어와 결과도 함께 사라진다. */
function PlacePickerPanel({ onAdd, region, savedPlaces, selectedKeys }: PlacePickerPanelProps) {
  const [selectionError, setSelectionError] = useState<string>();
  const [keyword, setKeyword] = useState("");
  const [query, setQuery] = useState("");
  const search = usePlaceSearch({ latitude: region?.latitude, longitude: region?.longitude, page: 1, query });

  /**
   * 저장해 둔 장소는 지역과 상관없이 전부 바로 고를 수 있다. 이번 지역에 있는 곳만 앞으로 보낸다.
   * 지역을 아직 안 골랐다면 고른 장소를 어느 지역에 붙일지 알 수 없어 검색으로만 시작한다.
   * 앞 5자리(시·군·구)로 비교한다. 예전에 동 단위로 저장된 장소도 같은 도시면 함께 앞으로 나온다.
   */
  const inRegion = (place: PlaceOption) => region && place.region_code.slice(0, 5) === region.code.slice(0, 5);
  const sortedSavedPlaces = region ? [...savedPlaces].sort((a, b) => Number(inRegion(b)) - Number(inRegion(a))) : [];

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

  // 고른 장소가 정말 그 검색 결과에 있었는지는 서버가 같은 검색어로 다시 확인한다.
  const resolve = useMutation({
    mutationFn: resolveRecordPlace,
    onMutate: () => setSelectionError(undefined),
    onSuccess: (result) => {
      if ("error" in result) {
        setSelectionError(result.error);
        return;
      }

      onAdd(result.place, result.region);
    },
    onError: () => setSelectionError("장소를 확인하지 못했어요.\n잠시 후 다시 시도해 주세요."),
  });

  function selectPlace(place: KakaoPlace) {
    const searched = search.data;
    if (!searched) return;

    resolve.mutate({
      page: searched.page,
      providerPlaceId: place.id,
      query: searched.query,
      scope: searched.scope,
    });
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    setSelectionError(undefined);
    const nextQuery = keyword.trim();
    if (!nextQuery) return;

    if (nextQuery === query) {
      void search.refetch();
      return;
    }

    setQuery(nextQuery);
  }

  return (
    <>
      <DrawerHeader>
        <DrawerTitle>방문 장소 찾기</DrawerTitle>
        <DrawerDescription>
          {region ? `${region.name} 주변에서 방문한 곳을 찾아보세요.` : "첫 장소를 고르면 해당 지역이 자동 선택돼요."}
        </DrawerDescription>
      </DrawerHeader>

      <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 pb-[max(--spacing(4),env(safe-area-inset-bottom))]">
        {sortedSavedPlaces.length ? (
          <section aria-labelledby="saved-place-quick-add" className="flex flex-col gap-2">
            <h3
              className="flex items-center gap-1.5 px-0.5 font-[650] text-muted-foreground text-xs"
              id="saved-place-quick-add"
            >
              <BookmarkIcon strokeWidth={2} className="size-3.5 text-foreground" aria-hidden="true" />내 장소에서 바로
              추가
            </h3>
            <ul className="flex max-h-23 flex-wrap gap-1.5 overflow-y-auto overscroll-contain">
              {sortedSavedPlaces.map((place) => {
                const added = selectedKeys.has(`existing:${place.id}`);

                return (
                  <li key={place.id}>
                    <Button
                      className="rounded-lg"
                      disabled={added || resolve.isPending}
                      onClick={() => addSavedPlace(place)}
                      size="sm"
                      type="button"
                      variant={added ? "secondary" : "outline"}
                    >
                      {place.name}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        <form aria-label="방문 장소 검색" onSubmit={handleSearch} role="search">
          <FieldGroup>
            <Field>
              <div className="flex gap-2">
                <Input
                  aria-label="방문 장소 이름"
                  className="h-11 flex-1"
                  maxLength={100}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="예: 메가커피"
                  value={keyword}
                />
                <Button className="h-11 px-5" disabled={!keyword.trim()} loading={search.isFetching} type="submit">
                  검색
                </Button>
              </div>
            </Field>
          </FieldGroup>
        </form>

        {search.isError || selectionError ? (
          <Alert variant="destructive">
            <WarningCircleIcon strokeWidth={2} aria-hidden="true" />
            <AlertDescription>{selectionError ?? getErrorMessage(search.error)}</AlertDescription>
          </Alert>
        ) : null}

        {search.data?.places.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground text-sm">검색 결과가 없어요.</p>
        ) : null}

        {search.data?.places.length ? (
          <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain pr-1">
            {search.data.places.map((place) => {
              const selected = selectedKeys.has(`kakao:${place.id}`);
              return (
                <li className="rounded-xl border bg-card p-3" key={place.id}>
                  <div className="flex items-start gap-3">
                    <MapPinIcon
                      strokeWidth={2}
                      className="mt-0.5 size-4.5 shrink-0 text-foreground [stroke-width:2]"
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
                    disabled={selected || resolve.isPending}
                    loading={resolve.isPending && resolve.variables.providerPlaceId === place.id}
                    onClick={() => selectPlace(place)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    {selected ? "추가됨" : "방문 장소에 추가"}
                  </Button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
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
    <Drawer onOpenChange={setOpen} open={open} showSwipeHandle>
      <DrawerTrigger
        disabled={disabled}
        render={<Button size="lg" disabled={disabled} type="button" variant="outline" />}
      >
        방문 장소 추가
      </DrawerTrigger>
      <DrawerVirtualKeyboardProvider>
        {/* 검색 결과에 따라 내용이 늘었다 줄었다 한다. 높이를 맡기면 결과가 도착할 때 시트가 손가락 밑에서 솟는다. */}
        <DrawerContent className="[--drawer-height:var(--drawer-content-max-height)]">
          <PlacePickerPanel
            onAdd={(place, placeRegion) => {
              onAdd(place, placeRegion);
              setOpen(false);
            }}
            region={region}
            savedPlaces={savedPlaces}
            selectedKeys={selectedKeys}
          />
        </DrawerContent>
      </DrawerVirtualKeyboardProvider>
    </Drawer>
  );
}
