import { useEffect, useState } from "react";

/**
 * 화면 키보드가 가린 높이(px).
 * iOS 홈 화면 앱은 키보드가 올라와도 레이아웃 높이를 줄이지 않아서, 화면 아래에 붙인 버튼이 키보드 뒤에 숨는다.
 * 보이는 영역(visualViewport)이 레이아웃 아래쪽에서 얼마나 줄었는지로 잰다. 키보드가 없으면 0이다.
 */
export const useKeyboardInset = () => {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const update = () => {
      setInset(Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop)));
    };

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);

  return inset;
};
