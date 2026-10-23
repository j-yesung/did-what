"use client";

import { createContext, type ReactNode, useContext } from "react";

// biome-ignore lint/suspicious/noExplicitAny: 인자와 반환 형태가 제각각인 함수를 한 표에 담는다.
type AnyFunction = (...args: any[]) => any;

export type DemoOverrides = ReadonlyMap<AnyFunction, AnyFunction>;

const DemoOverrideContext = createContext<DemoOverrides | null>(null);

/**
 * 서버 액션처럼 화면 밖에 흔적을 남기는 함수를 바꿔 끼우는 자리.
 * 체험 데모가 실제 저장·권한 요청 없이 같은 화면을 쓰려고 둔다. 공급자가 없으면 원래 함수를 그대로 쓴다.
 */
export function DemoOverrideProvider({ children, overrides }: { children: ReactNode; overrides: DemoOverrides }) {
  return <DemoOverrideContext.Provider value={overrides}>{children}</DemoOverrideContext.Provider>;
}

export const useDemoOverride = <T extends AnyFunction>(fn: T): T => {
  const overrides = useContext(DemoOverrideContext);
  return (overrides?.get(fn) as T | undefined) ?? fn;
};
