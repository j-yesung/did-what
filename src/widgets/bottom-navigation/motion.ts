const MOVE_EASING = "cubic-bezier(0.77, 0, 0.175, 1)";
const SETTLE_EASING = "cubic-bezier(0.23, 1, 0.32, 1)";
const MOVE_DURATION = 280;
const SETTLE_DISTANCE = 4;
const SPRING = { damping: 25, delay: 230, duration: 280, frames: 30, mass: 1, stiffness: 625 } as const;

const cancelAnimations = (element: HTMLSpanElement | null) => {
  element?.getAnimations().forEach((animation) => animation.cancel());
};

const SPRING_OFFSETS = (() => {
  const angularFrequency = Math.sqrt(SPRING.stiffness / SPRING.mass);
  const dampingRatio = SPRING.damping / (2 * Math.sqrt(SPRING.stiffness * SPRING.mass));
  const dampedFrequency = angularFrequency * Math.sqrt(1 - dampingRatio ** 2);
  const samples = Array.from({ length: SPRING.frames + 1 }, (_, index) => {
    const seconds = (index / SPRING.frames) * (SPRING.duration / 1000);
    return Math.exp(-dampingRatio * angularFrequency * seconds) * Math.sin(dampedFrequency * seconds);
  });
  const peak = Math.max(...samples);

  return samples.map((sample, index) => (index === SPRING.frames ? 0 : (sample / peak) * SETTLE_DISTANCE));
})();

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

export const settleIndicator = (indicator: HTMLSpanElement | null, direction: number) => {
  if (!indicator) return;

  const currentTransform = getComputedStyle(indicator).transform;
  const currentX = currentTransform === "none" ? 0 : new DOMMatrixReadOnly(currentTransform).m41;
  cancelAnimations(indicator);
  if (direction === 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  indicator.animate(
    SPRING_OFFSETS.map((offset, index) => ({
      transform: `translateX(${index === 0 ? currentX : offset * direction}px)`,
    })),
    { delay: currentX === 0 ? SPRING.delay : 0, duration: SPRING.duration },
  );
};

export const cancelIndicatorMotion = (...indicators: Array<HTMLSpanElement | null>) => {
  indicators.forEach(cancelAnimations);
};
