import type { ReactNode } from "react";

import { WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";

import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";

type LoadErrorAlertProps = {
  icon?: ReactNode;
  /** 다시 조회할 방법이 있을 때만 넘긴다. 없는 기록처럼 다시 해도 같은 결과면 버튼을 두지 않는다. */
  onRetry?: () => void;
  retrying?: boolean;
  title: string;
};

/**
 * 화면 데이터를 못 불러왔을 때의 공통 안내.
 * 원인은 사용자가 할 수 있는 일이 없어 문구를 통일한다.
 */
export function LoadErrorAlert({ icon, onRetry, retrying, title }: LoadErrorAlertProps) {
  return (
    <Alert className="has-data-[slot=alert-action]:pr-24" variant="destructive">
      {icon ?? <WarningCircleIcon strokeWidth={2} aria-hidden="true" />}
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {onRetry ? "연결을 확인하고 다시 시도해 주세요." : "잠시 후 다시 시도해 주세요."}
      </AlertDescription>
      {onRetry ? (
        <AlertAction className="top-1/2 -translate-y-1/2">
          <Button color="dark" loading={retrying} onClick={onRetry} type="button" variant="weak">
            다시 시도
          </Button>
        </AlertAction>
      ) : null}
    </Alert>
  );
}
