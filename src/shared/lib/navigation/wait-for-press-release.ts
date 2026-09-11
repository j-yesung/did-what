const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/** 복귀 중인 화면이 iOS 뒤로가기 스냅샷에 남지 않도록 실제 완료와 페인트를 기다린다. */
export const waitForPressRelease = async (element: Element) => {
  // 클릭 태스크가 끝나 :active가 풀린 뒤 복귀 트랜지션을 조회한다.
  await nextFrame();
  const transitions = element
    .getAnimations({ subtree: true })
    .filter(
      (animation) =>
        typeof CSSTransition !== "undefined" &&
        animation instanceof CSSTransition &&
        ["scale", "transform", "opacity", "background-color"].includes(animation.transitionProperty),
    );
  if (transitions.length === 0) return;
  // 요소가 사라지거나 트랜지션이 취소되어도 finished의 rejection을 처리한다.
  await Promise.allSettled(transitions.map((animation) => animation.finished));
  // rAF는 페인트 전에 실행된다. 다음 프레임까지 넘겨 복귀 결과를 그릴 기회를 준다.
  await nextFrame();
  await nextFrame();
};
