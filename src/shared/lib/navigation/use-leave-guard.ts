"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { getAppPathname } from "./app-pathname";
import { canGoBack } from "./use-go-back";

const SENTINEL = "leaveGuard";
const CAN_GO_BACK = "leaveGuardCanGoBack";

type LeaveGuardOptions = {
  /** 저장 중에는 뒤로가기를 되돌려 화면을 지킨다. */
  busy?: boolean;
  /** 보초 위에 더 쌓이는 항목 수. 작성 퍼널의 단계 이동이 여기에 해당한다. */
  extraEntries?: number;
  fallbackHref: string;
  isDirty: () => boolean;
};

/**
 * 작성 중인 폼을 뒤로가기로 떠나려 할 때 확인을 띄운다. 헤더 버튼, 브라우저 뒤로가기, 모바일 스와이프 모두 같은 길을 지난다.
 *
 * 브라우저 뒤로가기는 막을 수 없고 일어난 뒤에야 알 수 있다. 그래서 폼 위에 같은 주소로 보초 항목을 하나 더 쌓는다.
 * 보초에는 이전 화면이 있었는지도 적어 두어, 폼이 다시 마운트돼도(퍼널 단계 이동) 같은 판단을 이어 간다.
 * 퍼널 단계는 history.state를 복사해 쌓으므로 보초 표식이 함께 전파되고, 처음 진입한 항목만 표식 없이 남는다.
 *
 * 표식 없는 항목에 내려오면 떠나려는 것이다. 입력이 있으면 보초로 먼저 되돌아간 뒤 확인을 띄워 주소가 바뀐 채 묻지 않는다.
 *
 * 떠난 뒤에는 왔던 곳으로 돌아가기만 하고 새 항목을 쌓지 않는다. 쌓으면 같은 화면이 두 번 남아 뒤로가기가 한 번 먹히지 않는다.
 * 그 대가로 앞으로가기 기록에 폼이 남지만, 홈 화면 앱은 PreventForwardSwipe가 앞으로가기 스와이프를 막는다.
 * Next는 외부 pushState에도 자기 내부 상태를 얹어 주므로 보초 항목으로 돌아와도 페이지를 새로 고치지 않는다.
 */
export const useLeaveGuard = ({ busy = false, extraEntries = 0, fallbackHref, isDirty }: LeaveGuardOptions) => {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  // 보초 위에서는 뒤로 갈 곳이 항상 있어서, 세우기 전에 재둔다.
  const couldGoBack = useRef(false);
  const leaving = useRef(false);
  const canceling = useRef(false);
  const restoring = useRef(false);

  // 취소로 떠난 뒤의 마무리. 폼 이전 화면이 없으면 지금 항목이 폼이라 목적지로 바꾼다.
  const finishCanceling = () => {
    if (!canceling.current) return;
    canceling.current = false;
    if (!couldGoBack.current) router.replace(fallbackHref);
  };

  const leave = () => {
    leaving.current = true;
    canceling.current = true;
    if (couldGoBack.current) window.history.back();
    else finishCanceling();
  };

  const onPopState = useEffectEvent((event: PopStateEvent) => {
    // 이미 떠나는 중이다. 폼이 쓰던 항목을 다 걷어낸 자리라 여기서 이탈로 다시 판정하면 한 칸을 더 지나친다.
    if (leaving.current) {
      finishCanceling();
      return;
    }

    if (busy) {
      window.history.forward();
      return;
    }

    if (restoring.current && event.state?.[SENTINEL]) {
      restoring.current = false;
      setConfirmOpen(true);
      return;
    }

    // 보초나 퍼널 단계 위다. 아직 폼 안이다.
    if (event.state?.[SENTINEL]) {
      setConfirmOpen(false);
      return;
    }

    if (isDirty()) {
      restoring.current = true;
      window.history.forward();
      return;
    }

    leave();
  });

  const onBeforeUnload = useEffectEvent((event: BeforeUnloadEvent) => {
    if (leaving.current || !isDirty()) return;
    event.preventDefault();
    event.returnValue = "";
  });

  useEffect(() => {
    const state = window.history.state ?? {};
    if (state[SENTINEL]) {
      couldGoBack.current = Boolean(state[CAN_GO_BACK]);
    } else {
      couldGoBack.current = canGoBack();
      window.history.pushState(
        { ...state, [CAN_GO_BACK]: couldGoBack.current, [SENTINEL]: true },
        "",
        window.location.href,
      );
    }

    const handlePopState = (event: PopStateEvent) => onPopState(event);
    const handleBeforeUnload = (event: BeforeUnloadEvent) => onBeforeUnload(event);
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return {
    confirmOpen,
    /** 확인 대화상자에서 나가기. 지금은 보초 위라 보초와 폼 항목을 함께 걷어낸다. */
    confirmLeave: () => {
      leaving.current = true;
      canceling.current = true;
      setConfirmOpen(false);
      window.history.go(couldGoBack.current ? -2 : -1);
    },
    /** 헤더 뒤로가기. 브라우저 뒤로가기와 같은 길로 합류한다. */
    exit: () => window.history.back(),
    /**
     * 저장을 마치고 목적지로 간다. 착지한 뒤의 일은 여기서 거는 일회성 리스너가 한다.
     * React 19는 popstate 안의 전환을 동기로 그려 폼이 바로 언마운트되므로, effect에 건 리스너는 착지 후 호출되지 않는다.
     */
    finish: (destination: string) => {
      leaving.current = true;
      window.addEventListener(
        "popstate",
        () => {
          if (!couldGoBack.current) router.replace(destination);
          // 왔던 화면이 목적지가 아니면(지도 시트에서 수정을 시작한 경우) 목적지를 그 위에 얹는다.
          else if (getAppPathname() !== getAppPathname(destination)) router.push(destination);
        },
        { once: true },
      );
      // 폼 항목, 보초(이전 화면이 있을 때), 그 위에 쌓인 항목을 한 번에 걷어낸다.
      window.history.go(-(1 + extraEntries + (couldGoBack.current ? 1 : 0)));
    },
    stay: () => setConfirmOpen(false),
  };
};
