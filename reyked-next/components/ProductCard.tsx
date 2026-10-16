"use client";

import Link from "next/link";
import { catName, type Producto } from "@/data/productos";
import { clp } from "@/lib/format";
import { Glyph } from "./Glyph";
import { useBuyActions } from "./AddButton";

export function ProductCard({ p }: { p: Producto }) {
  const { agregar, comprarAhora } = useBuyActions();
  return (
    <article className="card">
      <Link className="ph" href={`/producto/${p.id}`} aria-label={`Ver ${p.n}`}>
        <Glyph g={p.g} />
        <span className="tag">{catName(p.c)}</span>
      </Link>
      <div className="body">
        <div className="cat">{p.s}</div>
        <h3>
          <Link href={`/producto/${p.id}`}>{p.n}</Link>
        </h3>
        <div className="stock">En stock</div>
        <div className="price">
          {clp(p.p)}
          <small>+ IVA</small>
        </div>
        <div className="actions">
          <button className="btn signal" onClick={() => comprarAhora(p.id)}>
            Comprar ahora
          </button>
          <button className="btn" onClick={(e) => agregar(p.id, e.currentTarget)}>
            Agregar al carrito
          </button>
        </div>
      </div>
    </article>
  );
}
