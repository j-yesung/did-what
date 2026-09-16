const MOVE_EASING = "cubic-bezier(0.77, 0, 0.175, 1)";
const SETTLE_EASING = "cubic-bezier(0.23, 1, 0.32, 1)";
const MOVE_DURATION = 280;

const cancelAnimations = (element: HTMLSpanElement | null) => {
  element?.getAnimations().forEach((animation) => animation.cancel());
};

export const animateIndicator = (
  indicator: HTMLSpanElement | null,
  fromIndex: number,
  toIndex: number,
  tabCount: number,
) => {
  if (!indicator || fromIndex === toIndex || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const currentTransform = getComputedStyle(indicator).transform;
  const direction = Math.sign(toIndex - fromIndex);
  const stretch = toIndex === 0 || toIndex === tabCount - 1 ? 1.06 : 1.1;

  cancelAnimations(indicator);
  indicator.style.transformOrigin = direction > 0 ? "left center" : "right center";
  indicator.animate(
    [
      { offset: 0, transform: currentTransform },
      { easing: MOVE_EASING, offset: 0.18, transform: "scale(1)" },
      { easing: SETTLE_EASING, offset: 0.56, transform: `scale(${stretch}, 0.98)` },
      { easing: SETTLE_EASING, offset: 0.84, transform: "scale(1.025, 0.995)" },
      { transform: "scale(1)" },
    ],
    { duration: MOVE_DURATION },
  );
};

export const cancelIndicatorMotion = (...indicators: Array<HTMLSpanElement | null>) => {
  indicators.forEach(cancelAnimations);
};
