"use client";

import Link from "next/link";
import { useState } from "react";
import { useBuyActions } from "./AddButton";

/** Selector de cantidad y acciones de compra de la ficha de producto. */
export function ProductBuy({ id }: { id: string }) {
  const [q, setQ] = useState(1);
  const { agregar, comprarAhora } = useBuyActions();
  return (
    <>
      <div className="buy">
        <div className="step">
          <button onClick={() => setQ(Math.max(1, q - 1))} aria-label="Menos">−</button>
          <output id="pqv" aria-live="polite">{q}</output>
          <button onClick={() => setQ(Math.min(999, q + 1))} aria-label="Más">+</button>
        </div>
        <button className="btn signal" onClick={() => comprarAhora(id, q)}>Comprar ahora</button>
        <button className="btn" onClick={(e) => agregar(id, e.currentTarget, q)}>Agregar al carrito</button>
      </div>
      <Link className="btn" href={`/contacto?producto=${id}`}>Cotizar por volumen</Link>
    </>
  );
}
