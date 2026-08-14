"use client";

import { BookmarkIcon } from "lucide-react";

import { useActionMutation } from "@/shared/lib/server-action/use-action-mutation";
import { Button } from "@/shared/ui/button";

import { setPlaceSaved } from "../model/actions";

type PlaceSaveButtonProps = {
  iconOnly?: boolean;
  placeId: string;
  saved: boolean;
};

export function PlaceSaveButton({ iconOnly, placeId, saved }: PlaceSaveButtonProps) {
  const toggle = useActionMutation(() => setPlaceSaved(placeId, !saved), {
    error: "바꾸지 못했어요",
    success: saved ? "내 장소에서 해제했어요" : "내 장소에 저장했어요",
  });
  const currentSaved = toggle.data?.saved ?? saved;

  const label = currentSaved ? (saved ? "내 장소에서 해제" : "내 장소에 저장됨") : "내 장소에 저장";
  /**
   * 아이콘만 있는 버튼일 때만 아이콘을 쓴다. 글자가 함께 있으면 아이콘 없이 라벨만 보여준다.
   * 저장된 상태는 노란 덩어리로, 저장 전에는 윤곽선만으로 보여준다. 색이 아니라 채움 여부로도 구분된다.
   */
  const icon = <BookmarkIcon aria-hidden="true" className={currentSaved ? "fill-bookmark stroke-none" : undefined} />;

  return iconOnly ? (
    <Button
      aria-label={label}
      className="size-11 text-foreground [&_svg]:size-[18px]"
      disabled={toggle.isSuccess}
      loading={toggle.isPending}
      onClick={() => toggle.mutate()}
      size="icon-lg"
      type="button"
      variant="ghost"
    >
      {icon}
    </Button>
  ) : (
    <Button
      disabled={toggle.isSuccess}
      loading={toggle.isPending}
      onClick={() => toggle.mutate()}
      type="button"
      variant="outline"
    >
      {label}
    </Button>
  );
}
