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

export const waitForPressRelease = async (element: Element) => {
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
  for (const animation of transitions) animation.finish();

  await nextFrame();
  await nextFrame();
};
