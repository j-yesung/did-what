"use client";

import { useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { canGoBack } from "@/shared/lib/navigation/use-go-back";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog";

const SENTINEL = "leaveGuard";

function raiseSentinel() {
  if (window.history.state?.[SENTINEL]) return;
  window.history.pushState({ [SENTINEL]: true }, "");
}

type LeaveGuardProps = {
  /** 돌아갈 화면이 없을 때 대신 갈 곳. 헤더 뒤로가기의 fallback과 같은 값을 준다. */
  fallbackHref: string;
  isDirty: () => boolean;
};

/**
 * 작성 중인 폼을 뒤로가기로 떠나려 할 때 확인을 띄운다. 헤더 버튼, 브라우저 뒤로가기, 모바일 스와이프 모두 같은 길을 지난다.
 *
 * 브라우저 뒤로가기는 막을 수 없고 일어난 뒤에야 알 수 있다. 그래서 폼 위에 같은 주소로 빈 항목(보초)을 하나 더 쌓아 둔다.
 * 뒤로가기를 누르면 보초에서 폼의 진짜 항목으로 내려올 뿐 화면은 그대로이고, 그때 물어본다.
 * 계속 작성하면 보초를 다시 세우고, 나가면 한 번 더 뒤로 간다. 입력이 없으면 묻지 않고 바로 한 번 더 뒤로 간다.
 *
 * 헤더 버튼과 저장 완료는 별도 처리 없이 history.back()만 부른다. 보초 덕에 같은 흐름으로 합쳐진다.
 * Next는 외부 pushState에도 자기 내부 상태를 얹어 주므로 보초 항목으로 돌아와도 페이지를 새로 고치지 않는다.
 */
export function LeaveGuard({ fallbackHref, isDirty }: LeaveGuardProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  // 리스너는 마운트 때 한 번만 걸고, 최신 prop과 함수는 ref로 들여다본다.
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;
  // 보초 위에서는 뒤로 갈 곳이 항상 있어서, 세우기 전에 재둔다.
  const couldGoBack = useRef(false);
  const leaving = useRef(false);

  function leave() {
    leaving.current = true;
    setConfirmOpen(false);
    if (couldGoBack.current) {
      window.history.back();
      return;
    }

    router.replace(fallbackHref);
  }

  const leaveRef = useRef(leave);
  leaveRef.current = leave;

  function stay() {
    // 나가기를 누른 뒤에도 다이얼로그가 닫히며 한 번 더 들어온다. 그때 보초를 세우면 뒤로가기가 제자리로 돌아온다.
    if (leaving.current) return;
    raiseSentinel();
    setConfirmOpen(false);
  }

  useEffect(() => {
    if (!window.history.state?.[SENTINEL]) {
      couldGoBack.current = canGoBack();
      raiseSentinel();
    }

    function onPopState() {
      // 이미 떠나는 중이다. leave()가 부른 back()이 다시 여기로 들어오는데, 이탈로 또 판정하면 한 칸을 더 지나친다.
      if (leaving.current) return;

      // 앞으로가기로 보초 위에 되돌아온 경우. 아직 폼 안이다.
      if (window.history.state?.[SENTINEL]) {
        setConfirmOpen(false);
        return;
      }

      if (isDirtyRef.current()) {
        setConfirmOpen(true);
        return;
      }

      leaveRef.current();
    }

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return (
    <AlertDialog onOpenChange={(open) => (open ? setConfirmOpen(true) : stay())} open={confirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>작성 중인 내용이 사라져요</AlertDialogTitle>
          <AlertDialogDescription>이 화면을 나가면 입력한 내용이 저장되지 않아요.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={stay}>계속 작성</AlertDialogCancel>
          <AlertDialogAction onClick={leave} variant="destructive">
            나가기
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
