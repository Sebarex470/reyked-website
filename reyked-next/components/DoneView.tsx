"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WA } from "@/data/productos";
import { clp } from "@/lib/format";
import { KEY_COMPROBANTE, type Comprobante } from "@/lib/pedido-local";
import { Crumbs } from "./Crumbs";

export function DoneView() {
  const router = useRouter();
  const [o, setO] = useState<Comprobante | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY_COMPROBANTE);
      if (raw) return setO(JSON.parse(raw));
    } catch { /* sin almacenamiento */ }
    router.replace("/");
  }, [router]);

  if (!o) return null;
  const msg =
    `Hola Reyked, quiero confirmar este pedido (${o.id}):\n` +
    o.items.map((i) => `- ${i.q} x ${i.n}`).join("\n") +
    `\nTotal con IVA: ${clp(o.total)}\nEntrega: ${o.del}` +
    (o.addr ? `\nDirección: ${o.addr}` : "") +
    `\nNombre: ${o.name}\nTeléfono: ${o.phone}\nCorreo: ${o.mail}` +
    (o.rut ? `\nRUT/Razón social: ${o.rut}` : "");

  return (
    <div className="wrap page" style={{ maxWidth: 720 }}>
      <Crumbs items={[["Inicio", "/"], ["Pedido", null]]} />
      <h1>Pedido preparado</h1>
      <div className="ok-box">
        <b>Pedido {o.id} registrado.</b><br />
        Para que Reyked lo confirme, envíalo por WhatsApp con el botón de abajo.
      </div>
      <div className="panel" style={{ marginTop: 14 }}>
        {o.items.map((i) => (
          <div className="tot" key={i.n} style={{ paddingBlock: 10, borderBottom: "1px solid var(--line)" }}>
            <span>{i.q} × {i.n}</span><span>{clp(i.q * i.p)}</span>
          </div>
        ))}
        <div className="tot big" style={{ borderTop: 0, paddingBlock: 12 }}><span>Total con IVA</span><span>{clp(o.total)}</span></div>
      </div>
      <div className="btnrow" style={{ marginTop: 14 }}>
        <a className="btn signal" target="_blank" rel="noopener" href={`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`}>Enviar pedido por WhatsApp</a>
        <Link className="btn" href="/tienda">Seguir comprando</Link>
      </div>
    </div>
  );
}
