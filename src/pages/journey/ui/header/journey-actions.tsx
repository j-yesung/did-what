import { ArrowsInSimpleIcon, ListBulletsIcon, MapTrifoldIcon, PlayIcon } from "@phosphor-icons/react";

import { MorphMenu } from "@/shared/ui/morph-menu";

type JourneyActionsProps = {
  replaying: boolean;
  routed: boolean;
  onFitRoutes: () => void;
  onReplay: () => void;
  onShowRecords: () => void;
  onReset: () => void;
};

export function JourneyActions({
  replaying,
  routed,
  onFitRoutes,
  onReplay,
  onShowRecords,
  onReset,
}: JourneyActionsProps) {
  return (
    <MorphMenu
      label="기록 지도 메뉴"
      layout="column"
      align="start"
      actions={[
        { label: "전체 경로 보기", icon: ArrowsInSimpleIcon, onSelect: onFitRoutes, disabled: !routed },
        { label: "다시 보기", icon: PlayIcon, onSelect: onReplay, disabled: replaying || !routed },
        { label: "이 지역 기록 목록", icon: ListBulletsIcon, onSelect: onShowRecords },
        { label: "전국 지도로 돌아가기", icon: MapTrifoldIcon, onSelect: onReset },
      ]}
    />
  );
}
