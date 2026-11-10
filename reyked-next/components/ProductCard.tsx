"use client";

import Link from "next/link";
import { catName, estadoProducto, type Producto } from "@/data/productos";
import { clp } from "@/lib/format";
import { ProductImage } from "./ProductImage";
import { useBuyActions } from "./AddButton";

export function StockLabel({ p }: { p: Producto }) {
  const e = estadoProducto(p);
  if (e === "agotado") return <div className="stock out">Agotado</div>;
  if (e === "cotizar") return <div className="stock low">Precio a consultar</div>;
  if (e === "ultimas") return <div className="stock">Quedan {p.stock}</div>;
  return <div className="stock">En stock</div>;
}

export function ProductCard({ p }: { p: Producto }) {
  const { agregar, comprarAhora } = useBuyActions();
  const e = estadoProducto(p);
  return (
    <article className="card">
      <Link className="ph" href={`/producto/${p.id}`} aria-label={`Ver ${p.n}`}>
        <ProductImage p={p} sizes="(max-width:520px) 45vw, (max-width:980px) 30vw, 260px" />
        <span className="tag">{catName(p.c)}</span>
      </Link>
      <div className="body">
        <div className="cat">{p.s}</div>
        <h3>
          <Link href={`/producto/${p.id}`}>{p.n}</Link>
        </h3>
        <StockLabel p={p} />
        {p.p > 0 && (
          <div className="price">
            {clp(p.p)}
            <small>+ IVA</small>
          </div>
        )}
        <div className="actions">
          {e === "disponible" || e === "ultimas" ? (
            <>
              <button className="btn signal" onClick={() => comprarAhora(p.id)}>Comprar ahora</button>
              <button className="btn" onClick={(ev) => agregar(p.id, ev.currentTarget)}>Agregar al carrito</button>
            </>
          ) : (
            <Link className="btn" href={`/contacto?producto=${p.id}`}>
              {e === "cotizar" ? "Cotizar" : "Consultar disponibilidad"}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
