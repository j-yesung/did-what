"use client";

import { useState } from "react";

import { PlusIcon } from "@phosphor-icons/react";

import type { SavedPlaceRow } from "@/entities/place";
import { validateKakaoQuery } from "@/shared/api/kakao-local/validation";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { LiquidGlassButton } from "@/shared/ui/liquid-glass-button";

import { PlaceSearchForm } from "./place-search-form";
import { PlaceSearchResults } from "./place-search-results";

type PlaceSearchBottomSheetProps = {
  initialPlaces: SavedPlaceRow[];
  initialQuery?: string;
};

export function PlaceSearchBottomSheet({ initialPlaces, initialQuery }: PlaceSearchBottomSheetProps) {
  const [open, setOpen] = useState(initialQuery !== undefined);
  const [keyword, setKeyword] = useState(initialQuery ?? "");
  const [submitted, setSubmitted] = useState(Boolean(initialQuery));
  const result = validateKakaoQuery(keyword);
  const query = result.valid ? result.query : "";

  return (
    <BottomSheet onOpenChange={setOpen} open={open} showSwipeHandle>
      <div className="pointer-events-none fixed inset-x-0 bottom-(--nav-clearance) z-30">
        <div className="mx-auto flex w-full max-w-(--app-width) justify-end px-5">
          <BottomSheet.Trigger
            render={<LiquidGlassButton aria-label="새 장소 찾기" shape="circle" title="새 장소 찾기" />}
          >
            <PlusIcon aria-hidden="true" weight="bold" />
          </BottomSheet.Trigger>
        </div>
      </div>
      <BottomSheet.VirtualKeyboardProvider>
        <BottomSheet.Content className="bottom-(--drawer-keyboard-inset,0px) [--drawer-content-max-height:calc(100dvh-env(safe-area-inset-top)-16px-var(--drawer-keyboard-inset,0px))] [--drawer-height:var(--drawer-content-max-height)]">
          <BottomSheet.Header>
            <BottomSheet.Title className="text-left font-bold text-xl">새 장소 찾기</BottomSheet.Title>
            <BottomSheet.Description className="text-left">
              가 보고 싶은 곳을 내 장소에 저장해요.
            </BottomSheet.Description>
          </BottomSheet.Header>
          <div className="px-5 py-4">
            <PlaceSearchForm
              onSearch={(value) => {
                setKeyword(value);
                setSubmitted(Boolean(value));
              }}
              query={keyword}
              searchError={submitted && !result.valid ? result.error : undefined}
            />
          </div>
          {submitted && query ? (
            <PlaceSearchResults
              initialPlaces={initialPlaces}
              key={query}
              onReset={() => {
                setKeyword("");
                setSubmitted(false);
              }}
              query={query}
            />
          ) : null}
        </BottomSheet.Content>
      </BottomSheet.VirtualKeyboardProvider>
    </BottomSheet>
  );
}
