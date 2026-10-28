"use client";

import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
} from "react";

import { useRouter } from "next/navigation";

import { cn } from "@/shared/lib/utils";
import { BackButton } from "@/shared/ui/back-button";
import { BottomSheet, FULL_SHEET_HEIGHT } from "@/shared/ui/bottom-sheet";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

import { saveHomeAddress } from "../api/actions";
import { KakaoAddressSearch } from "./kakao-address-search";

type HomeAddressSheetProps = {
  address: string | null;
  /** 시트를 여는 버튼. BottomSheet.Trigger로 넘기면 닫힐 때 초점이 그 버튼으로 돌아간다. */
  children?: ReactNode;
  /** 앱 테마와 상관없이 어둡게 그린다. 주소 찾기 화면도 어두운 색으로 맞춘다. */
  dark?: boolean;
  memberName: string;
  onOpenChange: (open: boolean) => void;
  /** 저장에 성공해 시트가 닫힌 뒤 불린다. */
  onSaved?: () => void;
  open: boolean;
};

export function HomeAddressSheet({
  address,
  children,
  dark = false,
  memberName,
  onOpenChange,
  onSaved,
  open,
}: HomeAddressSheetProps) {
  const [value, setValue] = useState(address ?? "");
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(false);
  const [openingSearch, setOpeningSearch] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [header, setHeader] = useState<HTMLDivElement | null>(null);
  const [form, setForm] = useState<HTMLFormElement | null>(null);
  const compactHeightRef = useRef(360);
  const [compactHeight, setCompactHeight] = useState(360);
  const [snapPoint, setSnapPoint] = useState<number | string | null>(360);
  // 버튼으로 열든 다른 화면이 열든 같은 상태에서 시작한다. 주소가 없으면 바로 주소 찾기부터 보여준다.
  const [previousOpen, setPreviousOpen] = useState(open);
  if (previousOpen !== open) {
    setPreviousOpen(open);
    if (open) {
      setValue(address ?? "");
      setError("");
      if (!address) {
        setSearching(true);
        setSnapPoint(1);
      }
    } else {
      setOpeningSearch(false);
      setSearching(false);
      setSnapPoint(compactHeight);
    }
  }
  useEffect(
    () => () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    },
    [],
  );
  useLayoutEffect(() => {
    if (!open || searching || !header || !form) return;
    const measure = () => {
      const height = Math.ceil(header.offsetHeight + form.offsetHeight + 29);
      if (height === compactHeightRef.current) return;
      const previous = compactHeightRef.current;
      compactHeightRef.current = height;
      setCompactHeight(height);
      setSnapPoint((current) => (current === previous ? height : current));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    observer.observe(form);
    return () => observer.disconnect();
  }, [open, searching, header, form]);
  const selectAddress = useCallback((selected: string) => {
    setValue(selected);
    setError("");
    setSearching(false);
    setSnapPoint(compactHeightRef.current);
  }, []);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <BottomSheet
      open={open}
      snapPoints={[compactHeight, 1]}
      snapPoint={snapPoint}
      onSnapPointChange={setSnapPoint}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && searchTimer.current) {
          clearTimeout(searchTimer.current);
          searchTimer.current = null;
        }
        onOpenChange(nextOpen);
      }}
      showSwipeHandle
    >
      {children}
      <BottomSheet.Content
        className={cn("motion-safe:duration-250 motion-safe:ease-[cubic-bezier(0.32,0.72,0,1)]", dark && "dark")}
        style={{ "--drawer-content-max-height": `min(700px, ${FULL_SHEET_HEIGHT})` } as CSSProperties}
      >
        <BottomSheet.Header ref={setHeader}>
          {searching && (
            <div className="mb-5 flex justify-start">
              <BackButton
                aria-label="주소 설정으로 돌아가기"
                onClick={() => {
                  setSearching(false);
                  setSnapPoint(compactHeightRef.current);
                }}
              />
            </div>
          )}
          <BottomSheet.Title className="text-left font-bold text-xl">
            {searching ? "주소 찾기" : "나의 집 주소"}
          </BottomSheet.Title>
          <BottomSheet.Description className="mt-2 text-left">
            {searching ? "도로명이나 건물 이름으로 검색해 주세요." : `${memberName}님의 출발지로 사용해요.`}
          </BottomSheet.Description>
        </BottomSheet.Header>
        {searching ? (
          <KakaoAddressSearch dark={dark} onSelect={selectAddress} />
        ) : (
          <form
            ref={setForm}
            className="flex flex-col gap-4 px-5 pt-4 pb-7"
            onSubmit={(event) => {
              event.preventDefault();
              setError("");
              startTransition(async () => {
                const result = await saveHomeAddress(value);
                if (result.error) setError(result.error);
                else {
                  onOpenChange(false);
                  router.refresh();
                  onSaved?.();
                }
              });
            }}
          >
            <label htmlFor="home-address" className="font-medium">
              주소
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="home-address"
                autoComplete="street-address"
                value={value}
                readOnly
                placeholder="주소를 선택해 주세요"
                required
                maxLength={200}
                containerClassName="min-w-0 flex-1"
              />
              <Button
                type="button"
                variant="outline"
                disabled={openingSearch}
                onClick={() => {
                  setSnapPoint(1);
                  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                    setSearching(true);
                    return;
                  }
                  setOpeningSearch(true);
                  searchTimer.current = setTimeout(() => {
                    setOpeningSearch(false);
                    setSearching(true);
                    searchTimer.current = null;
                  }, 250);
                }}
              >
                주소 찾기
              </Button>
            </div>
            {error && (
              <p role="alert" className="text-destructive text-sm">
                {error}
              </p>
            )}
            <Button size="large" type="submit" loading={pending} disabled={openingSearch}>
              저장
            </Button>
          </form>
        )}
      </BottomSheet.Content>
    </BottomSheet>
  );
}
