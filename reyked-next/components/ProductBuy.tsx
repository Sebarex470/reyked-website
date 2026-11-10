"use client";

import Link from "next/link";
import { useState } from "react";
import { estadoProducto, productoPorId } from "@/data/productos";
import { useBuyActions } from "./AddButton";

/** Selector de cantidad y acciones de compra de la ficha de producto. */
export function ProductBuy({ id }: { id: string }) {
  const p = productoPorId[id];
  const e = estadoProducto(p);
  const [q, setQ] = useState(1);
  const { agregar, comprarAhora } = useBuyActions();
  const max = Math.min(999, p.stock);
  if (e === "agotado" || e === "cotizar") {
    return (
      <div className="buy">
        <Link className="btn signal" href={`/contacto?producto=${id}`}>
          {e === "cotizar" ? "Cotizar este producto" : "Consultar disponibilidad"}
        </Link>
      </div>
    );
  }
  return (
    <>
      <div className="buy">
        <div className="step">
          <button onClick={() => setQ(Math.max(1, q - 1))} aria-label="Menos">−</button>
          <output id="pqv" aria-live="polite">{q}</output>
          <button onClick={() => setQ(Math.min(max, q + 1))} aria-label="Más" disabled={q >= max}>+</button>
        </div>
        <button className="btn signal" onClick={() => comprarAhora(id, q)}>Comprar ahora</button>
        <button className="btn" onClick={(ev) => agregar(id, ev.currentTarget, q)}>Agregar al carrito</button>
      </div>
      <Link className="btn" href={`/contacto?producto=${id}`}>Cotizar por volumen</Link>
    </>
  );
}
