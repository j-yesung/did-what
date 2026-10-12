"use client";

import { createContext, type ReactNode, useContext } from "react";

// biome-ignore lint/suspicious/noExplicitAny: 인자와 반환 형태가 제각각인 함수를 한 표에 담는다.
type AnyFunction = (...args: any[]) => any;

export type ActionOverrides = ReadonlyMap<AnyFunction, AnyFunction>;

const ActionOverrideContext = createContext<ActionOverrides | null>(null);

/**
 * 서버 액션처럼 화면 밖에 흔적을 남기는 함수를 바꿔 끼우는 자리.
 * 체험 데모가 실제 저장·권한 요청 없이 같은 화면을 쓰려고 둔다. 공급자가 없으면 원래 함수를 그대로 쓴다.
 */
export function ActionOverrideProvider({ children, overrides }: { children: ReactNode; overrides: ActionOverrides }) {
  return <ActionOverrideContext.Provider value={overrides}>{children}</ActionOverrideContext.Provider>;
}

export const useActionOverride = <T extends AnyFunction>(action: T): T => {
  const overrides = useContext(ActionOverrideContext);
  return (overrides?.get(action) as T | undefined) ?? action;
};
