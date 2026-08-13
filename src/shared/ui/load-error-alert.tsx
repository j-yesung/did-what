import type { ReactNode } from "react";

import { CircleAlertIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";

type LoadErrorAlertProps = {
  icon?: ReactNode;
  title: string;
};

/**
 * 화면 데이터를 못 불러왔을 때의 공통 안내.
 * 원인은 사용자가 할 수 있는 일이 없어 문구를 통일한다.
 */
export function LoadErrorAlert({ icon, title }: LoadErrorAlertProps) {
  return (
    <Alert variant="destructive">
      {icon ?? <CircleAlertIcon aria-hidden="true" />}
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>잠시 후 다시 시도해 주세요.</AlertDescription>
    </Alert>
  );
}
