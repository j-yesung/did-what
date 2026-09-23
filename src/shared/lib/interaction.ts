/**
 * 누를 때와 뗄 때의 시간이 다르다. 누르는 건 순간이고 손을 떼면 표면이 천천히 복원되는 게 실제 감각에 가깝다.
 * 복귀 커브는 초반에 크게 움직이고 끝에서 길게 눕는 감속이라 350ms여도 느리게 느껴지지 않는다.
 */
const PRESS_EASING = "duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)] active:duration-[80ms] active:ease-out";

/**
 * 브라우저 기본 탭 하이라이트와 텍스트 선택은 꺼둔다.
 * 켜져 있으면 커스텀 반응과 별개 타이밍으로 켜졌다 꺼져 깜빡이는 것처럼 보인다.
 */
const PRESS_TOUCH = "relative touch-manipulation select-none [-webkit-tap-highlight-color:transparent]";

/**
 * 버튼처럼 작은 요소의 누름 반응. Button과 TextButton이 같은 느낌을 내도록 한곳에서 관리한다.
 *
 * 옅은 음영과 함께 살짝 줄어들어 안쪽으로 눌리는 것처럼 보이게 한다.
 * 음영은 배경이 없는 ghost·link 변형에서도 통하는 방식이라 작은 요소에는 이쪽을 쓴다.
 * 다크 모드에서는 검정 음영이 어두운 배경에 묻혀 보이지 않으므로 흰색으로 뒤집는다.
 *
 * 음영의 위치(inset)는 요소마다 달라서 쓰는 쪽에서 정한다.
 */
export const PRESS_FEEDBACK = [
  PRESS_TOUCH,
  `transition-transform ${PRESS_EASING}`,
  "active:scale-[0.97] motion-reduce:active:scale-100",
  "after:pointer-events-none after:absolute after:rounded-[inherit] after:bg-black after:opacity-0 dark:after:bg-white",
  "after:transition-opacity after:duration-[350ms] active:after:opacity-[0.06] active:after:duration-0",
  "disabled:after:opacity-0",
].join(" ");

/** 키보드 포커스 표시. 마우스·터치에는 나타나지 않는다. */
export const FOCUS_RING = "outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

/**
 * regular와 bold 사이의 아이콘 굵기.
 *
 * Phosphor는 thin·light·regular·bold·fill 다섯 단계뿐이고 regular(16)에서 bold(24)로 한 번에 뛴다.
 * 그 사이가 필요해서 regular 도형에 가는 선을 덧대 두께만 더한다. 값은 256 viewBox 기준이다.
 * 모서리를 둥글게 이어야 연필 끝처럼 뾰족한 곳에 가시가 생기지 않는다.
 */
export const ICON_WEIGHT_MEDIUM = "[&_svg]:stroke-current [&_svg]:[stroke-width:5] [&_svg]:[stroke-linejoin:round]";
