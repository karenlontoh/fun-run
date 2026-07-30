"use client";

import { useEffect, useRef, type CSSProperties } from "react";

type ParallaxShapeProps = {
  className?: string;
  speed?: number;
  spin?: number;
  style?: CSSProperties;
};

const MAX_ROTATE_DEG = 22;

export function ParallaxShape({ className = "", speed = 0.15, spin = 0.05, style }: ParallaxShapeProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const el = ref.current;
        if (el) {
          const y = window.scrollY;
          const magnitude = Math.min(Math.abs(y * spin), MAX_ROTATE_DEG);
          const rotate = spin < 0 ? -magnitude : magnitude;
          el.style.transform = `perspective(1200px) translateY(${y * speed}px) rotateX(${rotate}deg) rotateY(${(rotate * 0.6).toFixed(2)}deg)`;
        }
        ticking = false;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [speed, spin]);

  return <div ref={ref} className={`[transform-style:preserve-3d] ${className}`} style={style} />;
}
