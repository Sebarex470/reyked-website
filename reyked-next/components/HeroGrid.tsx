"use client";

import { useEffect, useRef } from "react";

/** Sección hero: la cuadrícula de fondo sigue al cursor (desactivado con movimiento reducido). */
export function HeroGrid({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const hero = ref.current;
    if (!hero || window.matchMedia?.("(prefers-reduced-motion:reduce)").matches) return;
    const move = (e: PointerEvent) => {
      const r = hero.getBoundingClientRect();
      hero.style.setProperty("--mx", e.clientX - r.left + "px");
      hero.style.setProperty("--my", e.clientY - r.top + "px");
    };
    hero.addEventListener("pointermove", move);
    return () => hero.removeEventListener("pointermove", move);
  }, []);
  return (
    <section className="hero" id="hero" ref={ref}>
      {children}
    </section>
  );
}
