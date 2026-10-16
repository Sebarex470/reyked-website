"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { KEY_COMPROBANTE, type Comprobante } from "@/lib/pedido-local";
import { Crumbs } from "./Crumbs";
import { CartLines, TotBlock } from "./CartView";

export function CheckoutView() {
  const { cart, totals, ready, clear } = useCart();
  const router = useRouter();
  const [envio, setEnvio] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const finished = useRef(false);

  // Carrito vacío → volver al carrito (como el prototipo), salvo justo después de confirmar.
  useEffect(() => {
    if (ready && !totals.n && !finished.current) router.replace("/carrito");
  }, [ready, totals.n, router]);

  if (!ready || !totals.n) return <div className="wrap page"><h1>Finalizar compra</h1></div>;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const v = (k: string) => String(f.get(k) ?? "").trim();
    const name = v("name"), phone = v("phone"), mail = v("mail"), rut = v("rut"), addr = v("addr");
    let bad = "";
    if (!name) bad = "Escribe tu nombre.";
    else if (!/^[+\d][\d\s()-]{6,}$/.test(phone)) bad = "Escribe un teléfono válido.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) bad = "Escribe un correo válido.";
    else if (envio && !addr) bad = "Escribe la dirección de despacho.";
    if (bad) return setErr(bad);
    setErr("");
    setBusy(true);
    try {
      const r = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: Object.keys(cart).map((id) => ({ id, q: cart[id] })),
          cliente: { nombre: name, tel: phone, mail, rut },
          entrega: envio ? "envio" : "retiro",
          dir: envio ? addr : "",
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "No se pudo registrar el pedido.");
      const c: Comprobante = {
        id: data.id, items: data.items, sub: data.sub, iva: data.iva, total: data.total,
        del: envio ? "Envío a todo Chile (por pagar)" : "Retiro en tienda (Las Heras 2241, local 7, Concepción)",
        addr: envio ? addr : "", name, phone, mail, rut,
      };
      try { sessionStorage.setItem(KEY_COMPROBANTE, JSON.stringify(c)); } catch { /* sin almacenamiento */ }
      finished.current = true;
      clear();
      router.push("/pedido");
    } catch (ex) {
      setErr(ex instanceof Error && ex.message !== "Failed to fetch" ? ex.message : "Sin conexión. Inténtalo de nuevo o escríbenos por WhatsApp.");
      setBusy(false);
    }
  }

  return (
    <div className="wrap page">
      <Crumbs items={[["Inicio", "/"], ["Carrito", "/carrito"], ["Finalizar compra", null]]} />
      <h1>Finalizar compra</h1>
      <div className="two-col">
        <form className="panel pad stack" onSubmit={onSubmit} noValidate>
          <div className="two">
            <label className="f" htmlFor="oName">Nombre y apellido<input id="oName" name="name" autoComplete="name" required /></label>
            <label className="f" htmlFor="oPhone">Teléfono<input id="oPhone" name="phone" type="tel" autoComplete="tel" required /></label>
          </div>
          <label className="f" htmlFor="oMail">Correo electrónico<input id="oMail" name="mail" type="email" autoComplete="email" required /></label>
          <label className="f" htmlFor="oRut">RUT o razón social (para factura o boleta)<input id="oRut" name="rut" placeholder="Opcional" /></label>
          <div className="pay" role="radiogroup" aria-label="Entrega">
            <label htmlFor="dPick">
              <input type="radio" name="del" id="dPick" checked={!envio} onChange={() => setEnvio(false)} />
              <span><b>Retiro en tienda</b>Calle Las Heras 2241, local 7, Concepción</span>
            </label>
            <label htmlFor="dShip">
              <input type="radio" name="del" id="dShip" checked={envio} onChange={() => setEnvio(true)} />
              <span><b>Envío a todo Chile</b>Por pagar, según courier</span>
            </label>
          </div>
          {envio && (
            <label className="f" htmlFor="oAddr">Dirección de despacho
              <input id="oAddr" name="addr" autoComplete="street-address" placeholder="Calle, número, comuna, región" />
            </label>
          )}
          <div className="fine">Pago: en esta propuesta el pedido se confirma por WhatsApp. La pasarela online se conecta en la versión final.</div>
          <div className="err" aria-live="polite">{err}</div>
          <button className="btn primary" type="submit" disabled={busy}>{busy ? "Enviando…" : "Confirmar pedido"}</button>
        </form>
        <aside className="sum">
          <h2>Tu pedido</h2>
          <div><CartLines editable={false} /></div>
          <TotBlock />
          <Link className="btn" href="/carrito">Editar carrito</Link>
        </aside>
      </div>
    </div>
  );
}
