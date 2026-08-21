"use client";

import type { Ref } from "react";
import { useEffect, useImperativeHandle, useRef, useState } from "react";

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

export type LeaveGuardHandle = {
  /** 저장이 끝났을 때 부른다. 폼이 쌓아 둔 항목을 걷어내고 destination으로 보낸다. */
  finish: (destination: string) => void;
};

type LeaveGuardProps = {
  /** 돌아갈 화면이 없을 때 대신 갈 곳. 헤더 뒤로가기의 fallback과 같은 값을 준다. */
  fallbackHref: string;
  isDirty: () => boolean;
  ref?: Ref<LeaveGuardHandle>;
};

/**
 * 작성 중인 폼을 뒤로가기로 떠나려 할 때 확인을 띄운다. 헤더 버튼, 브라우저 뒤로가기, 모바일 스와이프 모두 같은 길을 지난다.
 *
 * 브라우저 뒤로가기는 막을 수 없고 일어난 뒤에야 알 수 있다. 그래서 폼 위에 같은 주소로 빈 항목(보초)을 하나 더 쌓아 둔다.
 * 뒤로가기를 누르면 보초에서 폼의 진짜 항목으로 내려올 뿐 화면은 그대로이고, 그때 물어본다.
 * 계속 작성하면 보초를 다시 세우고, 나가면 한 번 더 뒤로 간다. 입력이 없으면 묻지 않고 바로 한 번 더 뒤로 간다.
 *
 * 그래서 폼은 히스토리를 두 칸 쓴다. 떠나는 길이 전부 여기를 지나야 이 두 칸이 정확히 걷힌다.
 * 헤더 버튼과 취소는 back() 한 번으로 합류하고, 저장은 목적지가 따로 있어 finish()로 들어온다.
 *
 * Next는 외부 pushState에도 자기 내부 상태를 얹어 주므로 보초 항목으로 돌아와도 페이지를 새로 고치지 않는다.
 */
export function LeaveGuard({ fallbackHref, isDirty, ref }: LeaveGuardProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  // 리스너는 마운트 때 한 번만 걸고, 최신 prop과 함수는 ref로 들여다본다.
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;
  // 보초 위에서는 뒤로 갈 곳이 항상 있어서, 세우기 전에 재둔다.
  const couldGoBack = useRef(false);
  const leaving = useRef(false);
  const destination = useRef<string | null>(null);

  function leave() {
    leaving.current = true;
    setConfirmOpen(false);
    // 보초는 이미 걷혔고 지금은 폼 항목 위다. 한 칸만 더 내려가면 왔던 화면이다.
    if (couldGoBack.current) {
      window.history.back();
      return;
    }

    router.replace(fallbackHref);
  }

  const leaveRef = useRef(leave);
  leaveRef.current = leave;

  useImperativeHandle(ref, () => ({
    finish(to: string) {
      leaving.current = true;
      destination.current = to;
      // 보초와 폼을 한 번에 걷어낸다. 어디에 내려앉는지는 popstate에서 보고 정한다.
      window.history.go(couldGoBack.current ? -2 : -1);
    },
  }));

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
      // 이미 떠나는 중이다. 폼이 쓰던 항목을 다 걷어낸 자리라 여기서 이탈로 다시 판정하면 한 칸을 더 지나친다.
      if (leaving.current) {
        const to = destination.current;
        destination.current = null;
        if (!to) return;

        // 폼 이전 화면이 없으면 지금 항목이 폼이다. 남기지 않도록 목적지로 바꾼다.
        if (!couldGoBack.current) router.replace(to);
        // 왔던 화면이 목적지가 아니면(홈에서 작성을 시작한 경우) 목적지를 그 위에 얹는다.
        else if (window.location.pathname !== to) router.push(to);
        return;
      }

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
  }, [router]);

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
