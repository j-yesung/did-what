"use client";

import { type CSSProperties, useCallback, useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { BackButton } from "@/shared/ui/back-button";
import { BottomSheet, FULL_SHEET_HEIGHT } from "@/shared/ui/bottom-sheet";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog, ConfirmDialogCancelButton } from "@/shared/ui/confirm-dialog";
import { FieldLegend, FieldSet } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";

import { deleteHomeAddress, saveHomeAddress } from "../api/actions";
import { KakaoAddressSearch } from "./kakao-address-search";

export function HomeAddressSetting({ address, memberName }: { address: string | null; memberName: string }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(address ?? "");
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(false);
  const [openingSearch, setOpeningSearch] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [header, setHeader] = useState<HTMLDivElement | null>(null);
  const [form, setForm] = useState<HTMLFormElement | null>(null);
  const compactHeightRef = useRef(360);
  const [compactHeight, setCompactHeight] = useState(360);
  const [snapPoint, setSnapPoint] = useState<number | string | null>(360);
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
  const [deleting, startDeleteTransition] = useTransition();
  const router = useRouter();
  return (
    <FieldSet>
      <FieldLegend>나의 집 주소</FieldLegend>
      <div className="flex items-center gap-3">
        <p className="min-w-0 flex-1 truncate text-sm">{address ?? "등록된 주소가 없어요"}</p>
        <BottomSheet
          open={open}
          snapPoints={[compactHeight, 1]}
          snapPoint={snapPoint}
          onSnapPointChange={setSnapPoint}
          onOpenChange={(nextOpen) => {
            setOpen(nextOpen);
            if (nextOpen && !address) {
              setSearching(true);
              setSnapPoint(1);
            } else if (!nextOpen) {
              if (searchTimer.current) clearTimeout(searchTimer.current);
              setOpeningSearch(false);
              setSearching(false);
              setSnapPoint(compactHeightRef.current);
            }
          }}
          showSwipeHandle
        >
          <BottomSheet.Trigger render={<Button size="small" type="button" variant="outline" />}>
            {address ? "변경" : "등록"}
          </BottomSheet.Trigger>
          <BottomSheet.Content
            className="motion-safe:duration-250 motion-safe:ease-[cubic-bezier(0.32,0.72,0,1)]"
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
              <KakaoAddressSearch onSelect={selectAddress} />
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
                      setOpen(false);
                      router.refresh();
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
                <Button size="large" type="submit" loading={pending} disabled={deleting || openingSearch}>
                  저장
                </Button>
              </form>
            )}
          </BottomSheet.Content>
        </BottomSheet>
        {address && (
          <Button
            type="button"
            color="danger"
            variant="weak"
            disabled={pending}
            onClick={() => {
              setError("");
              setDeleteConfirmOpen(true);
            }}
          >
            삭제
          </Button>
        )}
        <ConfirmDialog
          open={deleteConfirmOpen}
          onClose={() => {
            if (!deleting) setDeleteConfirmOpen(false);
          }}
          title="집 주소를 삭제할까요?"
          description={error || "주소를 삭제하면 집에서 출발하는 경로를 볼 수 없어요."}
          cancelButton={
            <ConfirmDialogCancelButton disabled={deleting} onClick={() => setDeleteConfirmOpen(false)}>
              취소
            </ConfirmDialogCancelButton>
          }
          confirmButton={
            <Button
              color="danger"
              variant="fill"
              loading={deleting}
              onClick={() => {
                setError("");
                startDeleteTransition(async () => {
                  const result = await deleteHomeAddress();
                  if (result.error) setError(result.error);
                  else {
                    setValue("");
                    setDeleteConfirmOpen(false);
                    setOpen(false);
                    router.refresh();
                  }
                });
              }}
            >
              주소 삭제
            </Button>
          }
        />
      </div>
    </FieldSet>
  );
}
