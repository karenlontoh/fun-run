"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function ScrollShadowHeader({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    function onScroll() {
      ref.current?.classList.toggle("shadow-lg", window.scrollY > 8);
      ref.current?.classList.toggle("shadow-navy/30", window.scrollY > 8);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header ref={ref} className="sticky top-0 z-50 bg-navy text-cream transition-shadow duration-300">
      {children}
    </header>
  );
}
