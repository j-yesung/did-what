"use client";

import { useState } from "react";

import { CircleAlertIcon, MapPinnedIcon, SearchIcon } from "lucide-react";

import { useRegionSearch } from "@/entities/region";
import { getErrorMessage } from "@/shared/api/http/get-error-message";
import { useDebounce } from "@/shared/hooks/use-debounce";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Spinner } from "@/shared/ui/spinner";

import type { RecordLocationRegion } from "../model/location-picker";

type RegionPickerDialogProps = {
  onSelect: (region: RecordLocationRegion) => void;
};

export function RegionPickerDialog({ onSelect }: RegionPickerDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger render={<Button size="sm" type="button" variant="outline" />}>
        <SearchIcon aria-hidden="true" data-icon="inline-start" />
        지역 찾기
      </DialogTrigger>
      {open ? (
        <RegionSearchContent
          onSelect={(region) => {
            onSelect(region);
            setOpen(false);
          }}
        />
      ) : null}
    </Dialog>
  );
}

/** 다이얼로그가 닫히면 이 내용이 통째로 언마운트되면서 검색어도 함께 사라진다. */
function RegionSearchContent({ onSelect }: RegionPickerDialogProps) {
  const [keyword, setKeyword] = useState("");
  const debouncedKeyword = useDebounce(keyword);
  const search = useRegionSearch(debouncedKeyword);

  return (
    <DialogContent className="flex max-h-[min(640px,calc(100dvh-2rem-env(safe-area-inset-top)-env(safe-area-inset-bottom)))] flex-col overflow-hidden sm:max-w-md">
      <DialogHeader>
        <DialogTitle>어느 지역에 갔나요?</DialogTitle>
        <DialogDescription>익숙한 지역명을 직접 입력해 보세요.</DialogDescription>
      </DialogHeader>

      {/* 입력이 멈추면 스스로 검색한다. 검색 버튼이 없으므로 record-form 안에서 폼이 겹칠 일도 없다. */}
      <div className="relative">
        <Input
          aria-label="지역 이름"
          maxLength={100}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="예: 망원동, 홍대"
          value={keyword}
        />
        {search.isFetching ? (
          <Spinner aria-label="검색 중" className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground" />
        ) : null}
      </div>

      {search.isError ? (
        <Alert variant="destructive">
          <CircleAlertIcon aria-hidden="true" />
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
                <MapPinnedIcon aria-hidden="true" data-icon="inline-start" />
                {region.fullName}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </DialogContent>
  );
}
