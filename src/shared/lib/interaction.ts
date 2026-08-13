/**
 * 누를 때의 반응. Button과 TextButton이 같은 느낌을 내도록 한곳에서 관리한다.
 *
 * 옅은 검은 음영과 함께 살짝 줄어들어 안쪽으로 눌리는 것처럼 보이게 한다.
 * 음영은 누르는 즉시 켜고 뗄 때만 서서히 지운다. 켜는 데도 시간을 주면 짧게 탭했을 때 아무 반응이 없는 것처럼 보인다.
 *
 * 음영의 위치(inset)는 요소마다 달라서 쓰는 쪽에서 정한다.
 */
export const PRESS_FEEDBACK = [
  "relative transition-transform duration-100 ease-out active:scale-[0.98] motion-reduce:active:scale-100",
  "after:pointer-events-none after:absolute after:rounded-[inherit] after:bg-black after:opacity-0",
  "after:transition-opacity after:duration-200 active:after:opacity-10 active:after:duration-0",
  "disabled:after:opacity-0",
].join(" ");

/** 키보드 포커스 표시. 마우스·터치에는 나타나지 않는다. */
export const FOCUS_RING = "outline-none focus-visible:ring-3 focus-visible:ring-ring/50";
