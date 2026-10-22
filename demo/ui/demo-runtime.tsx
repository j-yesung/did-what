"use client";

import { type ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { QueryClientProvider } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

import { AppLoading } from "@/app/ui/app-loading";
import { THEME_OPTIONS } from "@/features/switch-theme/model/theme";
import { applyTheme } from "@/features/switch-theme/model/theme-preference";
import { ActionOverrideProvider } from "@/shared/lib/action-override";

import { createDemoOverrides, createDemoRecordActions, getCurrentDemoMember } from "../lib/demo-actions";
import { toAppHref } from "../lib/demo-href";
import { createDemoQueryClient } from "../lib/demo-query-client";
import { DemoRouterBridge, navigateDemo } from "../lib/demo-router-bridge";
import { type DemoAppMessage, type DemoCommand, readDemoCommand, toAppMessage } from "../lib/messages";
import { addSampleRecord, receiveNotification } from "../model/actions";
import { resolveDemoQuery } from "../model/queries";
import { demoStore, useDemoState } from "../model/store";
import { DemoContext } from "./demo-context";

const actionContext = () => ({ createId: () => crypto.randomUUID(), now: new Date().toISOString() });

/** 서버 렌더링 때는 기기 저장소의 체험 데이터를 읽을 수 없어, 브라우저에서 한 번에 그린다. */
export function DemoAppProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return mounted ? <DemoRuntime>{children}</DemoRuntime> : <AppLoading />;
}

function DemoRuntime({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const state = useDemoState();
  const [embedded] = useState(() => window.parent !== window);
  const [queryClient] = useState(() =>
    createDemoQueryClient(async (queryKey, pageParam) => resolveDemoQuery(demoStore.get(), queryKey, pageParam)),
  );

  const dependencies = useMemo(
    () => ({ navigate: (path: string) => navigateDemo(path, { replace: true }), queryClient }),
    [queryClient],
  );
  const overrides = useMemo(() => createDemoOverrides(dependencies), [dependencies]);
  const recordActions = useMemo(() => createDemoRecordActions(dependencies), [dependencies]);

  const post = (message: DemoAppMessage) => {
    if (embedded) window.parent.postMessage(toAppMessage(message), window.location.origin);
  };

  const runCommand = (command: DemoCommand) => {
    const current = demoStore.get();
    const member = getCurrentDemoMember(current);

    switch (command.name) {
      case "navigate":
        navigateDemo(command.path);
        return;
      case "addRecord": {
        if (!member) return post({ message: "먼저 사용할 사람을 선택해 주세요.", tone: "warning", type: "feedback" });
        const result = addSampleRecord(current, member.id, actionContext());
        if (!result.ok) return post({ message: result.message, tone: "warning", type: "feedback" });
        demoStore.set(result.state);
        void queryClient.invalidateQueries();
        return post({
          message: `예시 기록 ‘${result.activity}’을(를) 추가했어요. 지도·기록·달력에서 확인해 보세요.`,
          tone: "success",
          type: "feedback",
        });
      }
      case "receiveNotification": {
        if (!member) return post({ message: "먼저 사용할 사람을 선택해 주세요.", tone: "warning", type: "feedback" });
        const result = receiveNotification(current, member.id, actionContext());
        if (!result.ok) return post({ message: result.message, tone: "warning", type: "feedback" });
        demoStore.set(result.state);
        void queryClient.invalidateQueries();
        const sender = current.members.find((candidate) => candidate.id !== member.id)?.name ?? "";
        return post({
          message: `${sender}님이 보낸 ${result.commentId ? "댓글" : "새 기록"} 알림이 왔어요. 오른쪽 위 종을 눌러 확인해 보세요.`,
          tone: "success",
          type: "feedback",
        });
      }
      case "switchMember": {
        const next = current.members.find(({ id, is_active }) => id === command.memberId && is_active);
        if (!next) return post({ message: "선택할 수 없는 구성원이에요.", tone: "warning", type: "feedback" });
        demoStore.set({ ...current, changed: true, currentMemberId: next.id });
        void queryClient.invalidateQueries();
        return post({
          message: `${next.name}님으로 전환했어요. 이제 댓글과 알림이 ${next.name}님 기준이에요.`,
          tone: "success",
          type: "feedback",
        });
      }
      case "setTheme": {
        demoStore.set({ ...current, changed: true, theme: command.theme });
        const label = THEME_OPTIONS.find(({ value }) => value === command.theme)?.label;
        return post({ message: `앱 화면 모드를 ‘${label}’로 바꿨어요.`, tone: "success", type: "feedback" });
      }
    }
  };

  const runCommandRef = useRef(runCommand);
  runCommandRef.current = runCommand;

  useEffect(() => {
    if (!embedded) return;
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== window.parent) return;
      const command = readDemoCommand(event.data);
      if (command) runCommandRef.current(command);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [embedded]);

  // 다시 알릴 계기로만 쓴다. 보낼 경로는 Next 반영을 기다리지 않고 지금 주소에서 읽는다.
  const search = searchParams?.toString() ?? "";

  // biome-ignore lint/correctness/useExhaustiveDependencies: 상태나 주소가 바뀔 때마다 부모 패널에 알린다.
  useEffect(() => {
    post({
      state: {
        changed: state.changed,
        currentMemberId: state.currentMemberId,
        members: state.members.filter(({ is_active }) => is_active).map(({ id, name }) => ({ id, name })),
        path: toAppHref(window.location.search),
        theme: state.theme,
      },
      type: "state",
    });
  }, [state, search]);

  // 앱의 화면 모드는 실제 쿠키 대신 체험 데이터로 정한다. 부모 패널은 그대로 둔다.
  useLayoutEffect(() => applyTheme(state.theme), [state.theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <ActionOverrideProvider overrides={overrides}>
        <DemoContext.Provider value={recordActions}>
          <DemoRouterBridge>{children}</DemoRouterBridge>
          {embedded ? null : <DemoBadge />}
        </DemoContext.Provider>
      </ActionOverrideProvider>
    </QueryClientProvider>
  );
}

/** 체험 페이지 밖에서 앱 주소를 바로 열었을 때도 데모임을 알린다. */
function DemoBadge() {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-60 flex justify-center pt-0.5">
      <a
        className="pointer-events-auto rounded-full bg-dark px-2.5 py-0.5 font-semibold text-[11px] text-dark-foreground"
        href="/demo"
        title="이 화면은 샘플 데이터로 동작하는 체험용 데모입니다. 변경사항은 실제 서비스에 저장되지 않습니다."
      >
        체험용 데모 · 샘플 데이터
      </a>
    </div>
  );
}
