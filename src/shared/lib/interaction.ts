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

/**
 * 카드처럼 면적이 큰 요소의 누름 반응. 색은 PRESS_SURFACE가 맡고 여기서는 축소만 한다.
 *
 * :active가 아니라 PressListener가 붙이는 `data-press="on"`으로 움직인다. 쓰는 요소에 `data-press=""`를 같이 달아야 한다.
 * :active는 스크롤을 시작하려는 손가락과 진짜 탭을 구분하지 못해서, 목록을 훑을 때마다 카드가 움찔한다.
 *
 * 축소는 비율이라 같은 값이어도 면적이 크면 가장자리가 움직이는 거리가 커진다. 그래서 버튼보다 조금 덜 줄인다.
 * 다만 너무 줄이면 배경색만 바뀌고 테두리는 제자리인 것처럼 보여서, 카드 전체가 아니라 속만 눌린 느낌이 난다.
 * 한 변이 눈에 보일 만큼은 움직여야 한다.
 */
export const PRESS_FEEDBACK_LARGE = [
  PRESS_TOUCH,
  "group/press transition-[transform,background-color] duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
  "data-[press=on]:scale-[0.975] data-[press=on]:duration-[80ms] data-[press=on]:ease-out",
  "motion-reduce:data-[press=on]:scale-100",
].join(" ");

/**
 * 눌린 표면의 색. PRESS_FEEDBACK_LARGE와 짝을 이뤄 배경을 가진 요소(카드)에 붙인다.
 *
 * 음영을 덮으면 배경뿐 아니라 그 위의 글자까지 같이 흐려진다. 글자가 많은 카드에서는 눌린 게 아니라 흐려진 것처럼 보인다.
 * 배경색만 바꾸면 글자 대비가 그대로 남는다.
 *
 * 카드를 링크로 감싼 구조와 카드 안에 링크를 겹쳐 둔 구조 둘 다 쓴다.
 * 앞은 카드가 눌린 요소의 자식이라 group으로, 뒤는 카드 자신이 눌린 요소라 직접 잡는다.
 */
export const PRESS_SURFACE = [
  "transition-[transform,background-color] duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
  "data-[press=on]:bg-pressed data-[press=on]:duration-[80ms] data-[press=on]:ease-out",
  "group-data-[press=on]/press:bg-pressed group-data-[press=on]/press:duration-[80ms] group-data-[press=on]/press:ease-out",
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
