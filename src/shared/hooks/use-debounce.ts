"use client";

import { useEffect, useState } from "react";

/** 입력이 멈춘 뒤에야 값을 넘긴다. 타이핑 한 글자마다 서버를 부르지 않게 한다. */
export function useDebounce<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
