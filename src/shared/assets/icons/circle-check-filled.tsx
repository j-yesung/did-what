import type { ComponentProps } from "react";

/** 채운 원 안의 체크. 원은 글자색을 따르고 체크만 흰색으로 남는다. */
export function CircleCheckFilledIcon(props: ComponentProps<"svg">) {
  return (
    <svg fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="12" cy="12" fill="currentColor" r="11" />
      <path d="m7.5 12 3 3 6-6" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}
