"use client";

import { type FormEvent, useState } from "react";

import { WarningCircleIcon } from "@phosphor-icons/react";

import { useRegionSearch } from "@/entities/region";
import { getErrorMessage } from "@/shared/api/http/get-error-message";
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

import type { RecordLocationRegion } from "../model/location-picker";

type RegionPickerDialogProps = {
  onSelect: (region: RecordLocationRegion) => void;
};

export function RegionPickerDialog({ onSelect }: RegionPickerDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Drawer onOpenChange={setOpen} open={open} showSwipeHandle>
      <DrawerTrigger render={<Button size="lg" type="button" variant="outline" />}>지역 찾기</DrawerTrigger>
      <DrawerVirtualKeyboardProvider>
        <RegionSearchContent
          onSelect={(region) => {
            onSelect(region);
            setOpen(false);
          }}
        />
      </DrawerVirtualKeyboardProvider>
    </Drawer>
  );
}

/**
 * 시트가 닫히면 이 내용이 통째로 언마운트되면서 검색어도 함께 사라진다.
 *
 * 언마운트는 Portal이 맡는다(keepMounted 기본값 false). 닫힘 애니메이션이 끝난 뒤에 걷어내므로
 * 여기서 open으로 직접 걸러내면 안 된다. 그러면 내용이 즉시 사라져 닫히는 모습이 보이지 않는다.
 */
function RegionSearchContent({ onSelect }: RegionPickerDialogProps) {
  const [keyword, setKeyword] = useState("");
  const [query, setQuery] = useState("");
  const search = useRegionSearch(query);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    const nextQuery = keyword.trim();
    if (!nextQuery) return;

    if (nextQuery === query) {
      void search.refetch();
      return;
    }

    setQuery(nextQuery);
  }
  // 검색 결과에 따라 내용이 늘었다 줄었다 한다. 높이를 맡기면 결과가 도착할 때 시트가 손가락 밑에서 솟는다.
  return (
    <DrawerContent className="[--drawer-height:var(--drawer-content-max-height)]">
      <DrawerHeader>
        <DrawerTitle>어느 지역에 갔나요?</DrawerTitle>
        <DrawerDescription>익숙한 지역명을 직접 입력해 보세요.</DrawerDescription>
      </DrawerHeader>

      <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 pb-[max(--spacing(4),env(safe-area-inset-bottom))]">
        <form aria-label="지역 검색" onSubmit={handleSearch} role="search">
          <FieldGroup>
            <Field>
              <div className="flex gap-2">
                <Input
                  aria-label="지역 이름"
                  className="h-11 flex-1"
                  maxLength={100}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="예: 망원동, 홍대"
                  value={keyword}
                />
                <Button className="h-11 px-5" disabled={!keyword.trim()} loading={search.isFetching} type="submit">
                  검색
                </Button>
              </div>
            </Field>
          </FieldGroup>
        </form>

        {search.isError ? (
          <Alert variant="destructive">
            <WarningCircleIcon strokeWidth={2} aria-hidden="true" />
            <AlertDescription>{getErrorMessage(search.error)}</AlertDescription>
          </Alert>
        ) : null}

        {search.data?.regions.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground text-sm">선택할 수 있는 지역이 없어요.</p>
        ) : null}

        {search.data?.related && search.data.regions.length ? (
          <p className="text-muted-foreground text-xs">입력한 검색어와 연관된 지역이에요.</p>
        ) : null}

        {search.data?.regions.length ? (
          <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain pr-1">
            {search.data.regions.map((region) => (
              <li key={region.code}>
                <Button
                  className="h-auto w-full justify-start whitespace-normal px-3 py-3 text-left"
                  onClick={() => onSelect({ ...region, label: search.data.query })}
                  type="button"
                  variant="outline"
                >
                  {region.fullName}
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </DrawerContent>
  );
}
