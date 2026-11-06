"use client";

import { useEffect } from "react";

const isNavigationKey = (event: KeyboardEvent) => event.key === "Tab" || event.key.startsWith("Arrow");

export function InputModality() {
  useEffect(() => {
    const root = document.documentElement;
    const markPointer = () => {
      root.dataset.input = "pointer";
    };
    const markKeyboard = (event: KeyboardEvent) => {
      if (isNavigationKey(event)) delete root.dataset.input;
    };

    document.addEventListener("pointerdown", markPointer, true);
    document.addEventListener("keydown", markKeyboard, true);
    return () => {
      document.removeEventListener("pointerdown", markPointer, true);
      document.removeEventListener("keydown", markKeyboard, true);
    };
  }, []);

  return null;
}
