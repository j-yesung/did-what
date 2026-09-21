import type { ComponentProps } from "react";

/**
 * 채운 삼각형 안의 느낌표. 삼각형은 글자색을 따르고 느낌표만 흰색으로 남는다.
 *
 * 느낌표는 외곽선 아이콘의 좌표보다 조금 작고 위에 있다. 원래 값 그대로면 채운 삼각형 안에서 밑변에 닿아 보인다.
 */
export function TriangleAlertFilledIcon(props: ComponentProps<"svg">) {
  return (
    <svg fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"
        fill="currentColor"
      />
      <path d="M12 9.6v3.5" stroke="#fff" strokeLinecap="round" strokeWidth="1.8" />
      <circle cx="12" cy="16" fill="#fff" r="1.05" />
    </svg>
  );
}
