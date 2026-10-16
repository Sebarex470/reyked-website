"use client";

import Link from "next/link";
import { productoPorId } from "@/data/productos";
import { useCart } from "@/context/CartContext";
import { clp } from "@/lib/format";
import { Crumbs } from "./Crumbs";
import { Glyph } from "./Glyph";

/** Líneas del pedido (editables en el carrito, solo lectura en el checkout). */
export function CartLines({ editable }: { editable: boolean }) {
  const { cart, setQty } = useCart();
  return (
    <>
      {Object.keys(cart).map((k) => {
        const p = productoPorId[k];
        const q = cart[k];
        return (
          <div className="line" key={k}>
            <div className="g" aria-hidden="true"><Glyph g={p.g} /></div>
            <div>
              <div className="nm"><Link href={`/producto/${k}`}>{p.n}</Link></div>
              <div className="fine mono">{clp(p.p)} c/u</div>
              <div className="meta">
                {editable ? (
                  <>
                    <div className="step">
                      <button onClick={() => setQty(k, q - 1)} aria-label="Quitar uno">−</button>
                      <output>{q}</output>
                      <button onClick={() => setQty(k, q + 1)} aria-label="Agregar uno">+</button>
                    </div>
                    <button className="rm" onClick={() => setQty(k, 0)}>Quitar</button>
                  </>
                ) : (
                  <span className="fine mono">Cant. {q}</span>
                )}
                <span className="lt">{clp(p.p * q)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

export function TotBlock() {
  const { totals: t } = useCart();
  return (
    <>
      <div className="tot"><span>Subtotal neto</span><span>{clp(t.sub)}</span></div>
      <div className="tot"><span>IVA 19%</span><span>{clp(t.iva)}</span></div>
      <div className="tot big"><span>Total</span><span>{clp(t.total)}</span></div>
    </>
  );
}

export function CartView() {
  const { totals, ready } = useCart();
  if (!ready) return <div className="wrap page"><h1>Tu carrito</h1></div>;
  if (!totals.n) {
    return (
      <div className="wrap page">
        <Crumbs items={[["Inicio", "/"], ["Carrito", null]]} />
        <h1>Tu carrito</h1>
        <div className="empty">
          <b>Tu carrito está vacío.</b><br />Agrega productos desde la tienda.
          <div style={{ marginTop: 14 }}><Link className="btn primary" href="/tienda">Ir a la tienda</Link></div>
        </div>
      </div>
    );
  }
  return (
    <div className="wrap page">
      <Crumbs items={[["Inicio", "/"], ["Tienda", "/tienda"], ["Carrito", null]]} />
      <h1>Tu carrito</h1>
      <div className="two-col">
        <div className="panel"><CartLines editable /></div>
        <aside className="sum">
          <h2>Resumen</h2>
          <TotBlock />
          <div className="fine">Precios netos; el IVA se suma al total. Envío por pagar.</div>
          <Link className="btn signal" href="/checkout">Finalizar compra</Link>
          <Link className="btn" href="/tienda">Seguir comprando</Link>
        </aside>
      </div>
    </div>
  );
}
