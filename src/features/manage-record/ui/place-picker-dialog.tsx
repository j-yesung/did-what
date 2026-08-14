"use client";

import { useState } from "react";

import { useMutation } from "@tanstack/react-query";
import { BookmarkIcon, CircleAlertIcon, MapPinIcon } from "lucide-react";

import type { PlaceOption } from "@/entities/place";
import { usePlaceSearch } from "@/entities/place/api/search-queries";
import { getErrorMessage } from "@/shared/api/http/get-error-message";
import type { KakaoPlace } from "@/shared/api/kakao-local";
import { useDebounce } from "@/shared/hooks/use-debounce";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Spinner } from "@/shared/ui/spinner";

import { resolveRecordPlace } from "../model/actions";
import type { RecordLocationPlace, RecordLocationRegion } from "../model/location-picker";

type PlacePickerPanelProps = {
  onAdd: (place: RecordLocationPlace, region: RecordLocationRegion) => void;
  region: RecordLocationRegion | null;
  savedPlaces: PlaceOption[];
  selectedKeys: Set<string>;
};

/** 다이얼로그가 닫히면 이 패널이 통째로 언마운트되면서 검색어와 결과도 함께 사라진다. */
function PlacePickerPanel({ onAdd, region, savedPlaces, selectedKeys }: PlacePickerPanelProps) {
  const [selectionError, setSelectionError] = useState<string>();
  const [keyword, setKeyword] = useState("");
  const debouncedKeyword = useDebounce(keyword);
  const search = usePlaceSearch({ page: 1, query: debouncedKeyword, regionName: region?.fullName });

  // 저장해 둔 장소는 선택한 지역 안에 있을 때만 검색 없이 바로 고를 수 있다.
  const savedInRegion = region ? savedPlaces.filter((place) => place.region_code === region.code) : [];

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
      expectedRegionCode: region?.code,
      page: searched.page,
      providerPlaceId: place.id,
      query: searched.query,
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

      {/* 입력이 멈추면 스스로 검색한다. 검색 버튼이 없으므로 record-form 안에서 폼이 겹칠 일도 없다. */}
      <div className="relative">
        <Input
          aria-label="방문 장소 이름"
          maxLength={100}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="예: 메가커피"
          value={keyword}
        />
        {search.isFetching ? (
          <Spinner aria-label="검색 중" className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground" />
        ) : null}
      </div>

      {search.isError || selectionError ? (
        <Alert variant="destructive">
          <CircleAlertIcon aria-hidden="true" />
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
