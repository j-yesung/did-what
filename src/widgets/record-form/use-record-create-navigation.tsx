"use client";

import { type RefObject, useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { canGoBack } from "@/shared/lib/navigation/use-go-back";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog, ConfirmDialogCancelButton } from "@/shared/ui/confirm-dialog";

const EXIT_SENTINEL = "recordCreateExitSentinel";
const EXIT_CAN_GO_BACK = "recordCreateCanGoBack";

type ExitIntent = { href: string; type: "save" } | { type: "cancel" };

/** 퍼널 단계 히스토리와 작성 화면 이탈용 보초 항목을 함께 정리한다. */
export function useRecordCreateNavigation({
  busyRef,
  dirty,
  fallbackHref,
  funnelIndex,
}: {
  busyRef: RefObject<boolean>;
  dirty: boolean;
  fallbackHref: string;
  funnelIndex: number;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const couldGoBackRef = useRef(false);
  const dirtyRef = useRef(dirty);
  const funnelIndexRef = useRef(funnelIndex);
  const intentRef = useRef<ExitIntent | null>(null);
  const leavingRef = useRef(false);
  const restoringRef = useRef(false);
  dirtyRef.current = dirty;
  funnelIndexRef.current = funnelIndex;

  useEffect(() => {
    const state = window.history.state ?? {};
    // 퍼널 단계에는 이 표식이 전파되고, 작성 화면에 처음 진입한 항목만 표식 없이 남는다.
    if (state[EXIT_SENTINEL]) {
      couldGoBackRef.current = Boolean(state[EXIT_CAN_GO_BACK]);
    } else {
      couldGoBackRef.current = canGoBack();
      window.history.pushState(
        {
          ...state,
          [EXIT_CAN_GO_BACK]: couldGoBackRef.current,
          [EXIT_SENTINEL]: true,
        },
        "",
        window.location.href,
      );
    }

    function pushDestination(intent: ExitIntent) {
      if (couldGoBackRef.current) {
        const href = intent.type === "save" ? intent.href : window.location.pathname + window.location.search;
        router.push(href);
        return;
      }

      const href = intent.type === "save" ? intent.href : fallbackHref;
      router.replace(href);
      requestAnimationFrame(() => router.push(href));
    }

    function finishLeaving() {
      const intent = intentRef.current;
      intentRef.current = null;
      if (intent) pushDestination(intent);
    }

    function leaveFromBase() {
      leavingRef.current = true;
      intentRef.current = { type: "cancel" };
      if (couldGoBackRef.current) {
        window.history.back();
      } else {
        finishLeaving();
      }
    }

    function onPopState(event: PopStateEvent) {
      if (leavingRef.current) {
        finishLeaving();
        return;
      }

      if (busyRef.current) {
        window.history.forward();
        return;
      }

      if (restoringRef.current && event.state?.[EXIT_SENTINEL]) {
        restoringRef.current = false;
        setConfirmOpen(true);
        return;
      }

      if (event.state?.[EXIT_SENTINEL]) return;

      if (dirtyRef.current) {
        // URL이 바뀐 채 다이얼로그가 뜨지 않도록 퍼널로 먼저 복귀한 뒤 이탈을 확인한다.
        restoringRef.current = true;
        window.history.forward();
        return;
      }

      leaveFromBase();
    }

    function warnBeforeUnload(event: BeforeUnloadEvent) {
      if (!dirtyRef.current || leavingRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", warnBeforeUnload);
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("beforeunload", warnBeforeUnload);
      window.removeEventListener("popstate", onPopState);
    };
  }, [busyRef, fallbackHref, router]);

  return {
    confirmDialog: (
      <ConfirmDialog
        cancelButton={
          <ConfirmDialogCancelButton onClick={() => setConfirmOpen(false)}>계속 작성</ConfirmDialogCancelButton>
        }
        confirmButton={
          <Button
            color="danger"
            onClick={() => {
              leavingRef.current = true;
              intentRef.current = { type: "cancel" };
              setConfirmOpen(false);
              window.history.go(couldGoBackRef.current ? -2 : -1);
            }}
            variant="fill"
          >
            나가기
          </Button>
        }
        description="이 화면을 나가면 입력한 내용이 저장되지 않아요."
        onClose={() => setConfirmOpen(false)}
        open={confirmOpen}
        title="작성 중인 내용이 사라져요"
      />
    ),
    exit: () => window.history.back(),
    finish: (href: string) => {
      leavingRef.current = true;
      intentRef.current = { href, type: "save" };
      // 작성 화면 기본 항목, 보초, 현재까지 쌓인 퍼널 단계를 한 번에 걷어낸다.
      window.history.go(-(funnelIndexRef.current + (couldGoBackRef.current ? 2 : 1)));
    },
  };
}
