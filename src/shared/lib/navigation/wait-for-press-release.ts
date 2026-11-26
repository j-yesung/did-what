const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

const SPRING_SCALE_TOLERANCE = 0.005;
const SPRING_RELEASE_LIMIT = 1500;
const PRESS_SETTLED_ATTRIBUTE = "data-press-settled";

const isSpringScaled = (node: Element) => {
  const scale = (node as Partial<HTMLElement>).style?.scale ?? "";
  return scale.split(" ").some((value) => value !== "" && Math.abs(Number(value) - 1) > SPRING_SCALE_TOLERANCE);
};

const releaseWhenSpringSettles = async (nodes: Element[]) => {
  const deadline = performance.now() + SPRING_RELEASE_LIMIT;
  while (nodes.some((node) => node.isConnected && isSpringScaled(node)) && performance.now() < deadline) {
    await nextFrame();
  }
  for (const node of nodes) node.removeAttribute(PRESS_SETTLED_ATTRIBUTE);
};

const settlePressSprings = (element: Element) => {
  const nodes: Element[] = [];
  for (let node: Element | null = element; node; node = node.parentElement) {
    if (isSpringScaled(node)) nodes.push(node);
  }
  for (const node of nodes) node.setAttribute(PRESS_SETTLED_ATTRIBUTE, "");
  if (nodes.length > 0) void releaseWhenSpringSettles(nodes);
  return nodes.length > 0;
};

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
  const settled = settlePressSprings(element);
  if (transitions.length === 0 && !settled) return;
  // 요소가 사라지거나 트랜지션이 취소되어도 finished의 rejection을 처리한다.
  await Promise.allSettled(transitions.map((animation) => animation.finished));
  // rAF는 페인트 전에 실행된다. 다음 프레임까지 넘겨 복귀 결과를 그릴 기회를 준다.
  await nextFrame();
  await nextFrame();
};
