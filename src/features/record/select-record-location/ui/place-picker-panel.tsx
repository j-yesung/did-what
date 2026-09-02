"use client";

import { type SubmitEvent, useState } from "react";

import { BookmarkIcon, MapPinIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";

import type { PlaceOption } from "@/entities/place";
import { usePlaceSearch } from "@/entities/place";
import { getErrorMessage } from "@/shared/api/http/get-error-message";
import type { KakaoPlace } from "@/shared/api/kakao-local";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { DrawerDescription, DrawerHeader, DrawerTitle } from "@/shared/ui/drawer";
import { SearchField } from "@/shared/ui/search-field";

import { resolveRecordPlace } from "../api/resolve-record-location";
import type { RecordLocationPlace, RecordLocationRegion } from "../model/location-picker";

type PlacePickerPanelProps = {
  onAdd: (place: RecordLocationPlace, region: RecordLocationRegion) => void;
  region: RecordLocationRegion | null;
  savedPlaces: PlaceOption[];
  selectedKeys: Set<string>;
};

export function PlacePickerPanel({ onAdd, region, savedPlaces, selectedKeys }: PlacePickerPanelProps) {
  const [selectionError, setSelectionError] = useState<string>();
  const [keyword, setKeyword] = useState("");
  const [query, setQuery] = useState("");
  const search = usePlaceSearch({ latitude: region?.latitude, longitude: region?.longitude, page: 1, query });

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

  function handleSearch(event: SubmitEvent<HTMLFormElement>) {
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
                      size="small"
                      type="button"
                      variant={added ? "weak" : "outline"}
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
          <SearchField
            aria-label="방문 장소 이름"
            loading={search.isFetching}
            maxLength={100}
            onClear={() => {
              setQuery("");
              setSelectionError(undefined);
            }}
            onValueChange={setKeyword}
            placeholder="예: 메가커피"
            value={keyword}
          />
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
                      className="mt-0.5 size-4.5 shrink-0 stroke-2 text-foreground"
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
                    className="mt-3"
                    disabled={selected || resolve.isPending}
                    fullWidth
                    loading={resolve.isPending && resolve.variables.providerPlaceId === place.id}
                    onClick={() => selectPlace(place)}
                    size="small"
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
