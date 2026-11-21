"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Producto } from "@/data/productos";
import { ProductCard } from "./ProductCard";

export function FeaturedCarousel({ productos }: { productos: Producto[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  useEffect(() => {
    const el = track.current;
    if (!el) return;

    const update = () => {
      const start = el.scrollLeft <= 1;
      const end = el.scrollWidth - el.clientWidth - el.scrollLeft <= 1;
      setEdges((previous) => previous.start === start && previous.end === end ? previous : { start, end });
    };

    const observer = new ResizeObserver(update);
    observer.observe(el);
    el.addEventListener("scroll", update, { passive: true });
    update();
    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", update);
    };
  }, [productos.length]);

  const move = (direction: -1 | 1) => {
    const el = track.current;
    const first = el?.children[0];
    const second = el?.children[1];
    if (!el || !first || !second || (direction === -1 ? edges.start : edges.end)) return;
    const step = second.getBoundingClientRect().left - first.getBoundingClientRect().left;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: direction * step, behavior: reduceMotion ? "instant" : "smooth" });
  };

  return (
    <section className="sec" aria-labelledby="featured-title">
      <div className="sec-h">
        <h2 id="featured-title">Productos destacados</h2>
        <div className="featured-actions">
          <Link href="/tienda">Ver todos →</Link>
          <div className="featured-controls">
            <button className="icon-btn" type="button" aria-label="Ver destacados anteriores"
              aria-controls="featured-track" aria-disabled={edges.start} onClick={() => move(-1)}>
              <svg className="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 6l-6 6 6 6" /></svg>
            </button>
            <button className="icon-btn" type="button" aria-label="Ver destacados siguientes"
              aria-controls="featured-track" aria-disabled={edges.end} onClick={() => move(1)}>
              <svg className="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 6l6 6-6 6" /></svg>
            </button>
          </div>
        </div>
      </div>
      <div ref={track} className="featured-track" id="featured-track" role="group" aria-labelledby="featured-title" tabIndex={0}>
        {productos.map((p) => (
          <ProductCard key={p.id} p={p} sizes="(max-width:520px) 94vw, (max-width:760px) 46vw, (max-width:1060px) 31vw, 283px" />
        ))}
      </div>
    </section>
  );
}
