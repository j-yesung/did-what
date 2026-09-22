"use client";

import { type SubmitEvent, startTransition, useMemo, useOptimistic, useState } from "react";

import { WarningCircleIcon } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";

import { usePlaceSearch } from "@/entities/place";
import { getErrorMessage } from "@/shared/api/http/get-error-message";
import type { KakaoPlace } from "@/shared/api/kakao-local";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/shared/ui/drawer";
import { SearchField } from "@/shared/ui/search-field";

import { resolveRecordPlace } from "../api/resolve-record-location";
import type { RecordLocationPlace, RecordLocationRegion } from "../model/location-picker";
import { SelectablePlaceCard } from "./selectable-place-card";

type PlacePickerPanelProps = {
  maxSelectionCount: number;
  onAdd: (places: RecordLocationPlace[]) => void;
  regions: RecordLocationRegion[];
  selectedKeys: Set<string>;
};

/** 좌표 없이 전국에서 찾는 칩. 지역 칩과 같은 목록에 들어가므로 코드 자리를 하나 비워 둔다. */
const NATIONWIDE_CODE = "";

export function PlacePickerPanel({ maxSelectionCount, onAdd, regions, selectedKeys }: PlacePickerPanelProps) {
  const [selectionError, setSelectionError] = useState<string>();
  const [keyword, setKeyword] = useState("");
  const [query, setQuery] = useState("");
  const [scopeCode, setScopeCode] = useState(regions[0]?.code ?? NATIONWIDE_CODE);
  const [selectedPlaces, setSelectedPlaces] = useState<Map<string, RecordLocationPlace>>(() => new Map());
  const selectedPlaceKeys = useMemo(() => new Set(selectedPlaces.keys()), [selectedPlaces]);
  const [optimisticSelectedKeys, selectOptimistically] = useOptimistic(selectedPlaceKeys, (current, key: string) =>
    new Set(current).add(key),
  );
  const scope = regions.find((region) => region.code === scopeCode);
  const search = usePlaceSearch({ latitude: scope?.latitude, longitude: scope?.longitude, page: 1, query });

  const resolve = useMutation({ mutationFn: resolveRecordPlace });

  const selectPlace = (place: KakaoPlace) => {
    const searched = search.data;
    const key = `kakao:${place.id}`;
    if (!searched || selectedKeys.has(key) || resolve.isPending) return;

    if (optimisticSelectedKeys.has(key)) {
      setSelectedPlaces((current) => {
        const next = new Map(current);
        next.delete(key);
        return next;
      });
      return;
    }

    if (optimisticSelectedKeys.size >= maxSelectionCount) return;

    setSelectionError(undefined);
    startTransition(async () => {
      selectOptimistically(key);

      try {
        const result = await resolve.mutateAsync({
          page: searched.page,
          providerPlaceId: place.id,
          query: searched.query,
          scope: searched.scope,
        });
        if ("error" in result) {
          setSelectionError(result.error);
          return;
        }

        setSelectedPlaces((current) => {
          if (current.size >= maxSelectionCount || selectedKeys.has(result.place.key)) return current;
          const next = new Map(current);
          next.set(result.place.key, result.place);
          return next;
        });
      } catch {
        setSelectionError("장소를 확인하지 못했어요.\n잠시 후 다시 시도해 주세요.");
      }
    });
  };

  const handleSearch = (event: SubmitEvent<HTMLFormElement>) => {
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
  };

  return (
    <>
      <DrawerHeader>
        <DrawerTitle>방문 장소 찾기</DrawerTitle>
        <DrawerDescription>
          {scope ? `${scope.label} 주변을 먼저 보여줘요.` : "다른 지역의 장소를 고르면 그 지역도 함께 담겨요."}
        </DrawerDescription>
      </DrawerHeader>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden p-4 pb-0">
        {regions.length ? (
          <ul aria-label="검색 기준 지역" className="flex flex-wrap gap-1.5">
            {[...regions, { code: NATIONWIDE_CODE, label: "전국" }].map((region) => (
              <li key={region.code || "nationwide"}>
                <Button
                  aria-pressed={region.code === scopeCode}
                  className="rounded-lg"
                  onClick={() => setScopeCode(region.code)}
                  size="small"
                  type="button"
                  variant={region.code === scopeCode ? "fill" : "outline"}
                >
                  {region.label}
                </Button>
              </li>
            ))}
          </ul>
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
          <ul className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden overscroll-contain p-1">
            {search.data.places.map((place) => {
              const key = `kakao:${place.id}`;
              const added = selectedKeys.has(key);
              const selected = optimisticSelectedKeys.has(key);
              const selectionLimitReached = optimisticSelectedKeys.size >= maxSelectionCount && !selected;
              const disabled = added || resolve.isPending || selectionLimitReached;

              return (
                <SelectablePlaceCard
                  added={added}
                  address={place.address ?? "주소 정보 없음"}
                  checkboxDisabled={selectionLimitReached}
                  disabled={disabled}
                  key={place.id}
                  name={place.name}
                  onSelect={() => selectPlace(place)}
                  selected={selected}
                />
              );
            })}
          </ul>
        ) : null}
      </div>

      <DrawerFooter className="pb-[max(--spacing(4),env(safe-area-inset-bottom))]">
        <Button
          aria-busy={resolve.isPending || undefined}
          disabled={optimisticSelectedKeys.size === 0}
          fullWidth
          onClick={() => {
            if (resolve.isPending) return;
            onAdd([...selectedPlaces.values()]);
          }}
          size="large"
          type="button"
        >
          {optimisticSelectedKeys.size > 0 ? `${optimisticSelectedKeys.size}곳 추가` : "장소 선택"}
        </Button>
      </DrawerFooter>
    </>
  );
}
