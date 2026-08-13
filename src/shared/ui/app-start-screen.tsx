"use client";

import { useEffect, useRef, useState } from "react";

const APP_START_LOGO = "/splash/app-start-logo.png";

export function AppStartScreen() {
  const [visible, setVisible] = useState(true);
  const [mounted, setMounted] = useState(true);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imageRef.current?.complete) setVisible(false);
  }, []);

  useEffect(() => {
    if (visible) return;

    const timeout = setTimeout(() => setMounted(false), 1500);

    return () => clearTimeout(timeout);
  }, [visible]);

  if (!mounted) return null;

  return (
    <div
      aria-hidden="true"
      className="app-start-screen fixed inset-0 z-[60] flex items-center justify-center bg-background transition-opacity duration-300 motion-reduce:transition-none"
      data-visible={visible}
    >
      <img
        alt=""
        className="size-36 object-contain sm:size-44"
        fetchPriority="high"
        onError={() => setVisible(false)}
        onLoad={() => setVisible(false)}
        ref={imageRef}
        src={APP_START_LOGO}
      />
    </div>
  );
}
