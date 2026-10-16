"use client";

import { useState } from "react";
import { ESTADOS_PAGO, ESTADOS_PEDIDO, type Pedido } from "@/lib/tipos";
import { api, clp, fechaHora } from "./api";
import type { VistaProps } from "./AdminApp";

const MEDIOS = ["Transferencia", "Webpay", "Tarjeta", "Mercado Pago", "Efectivo", "Otro"];

function Tarjeta({ p, recargar, avisar }: { p: Pedido } & Omit<VistaProps, "datos">) {
  async function guardar(body: Record<string, unknown>) {
    try {
      await api(`pedidos/${p.id}`, "PATCH", body);
      avisar("Guardado");
      await recargar();
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se pudo guardar");
      await recargar();
    }
  }
  return (
    <article className="adm-card">
      <div className="row">
        <b className="mono">{p.id}</b>
        <b>{clp(p.total)}</b>
      </div>
      <div className="fine">{fechaHora(p.fecha)} · neto {clp(p.sub)} + IVA {clp(p.iva)}</div>
      <p>
        <b>{p.cliente.nombre}</b> · <a href={`tel:${p.cliente.tel}`}>{p.cliente.tel}</a> · <a href={`mailto:${p.cliente.mail}`}>{p.cliente.mail}</a>
        {p.cliente.rut && <><br />RUT / razón social: {p.cliente.rut}</>}
        <br />{p.entrega === "envio" ? `Envío: ${p.dir}` : "Retiro en tienda"}
      </p>
      <ul>{p.items.map((i) => <li key={i.id}>{i.q} × {i.n} ({clp(i.p)} c/u)</li>)}</ul>
      <div className="adm-ctrl">
        <label className="f">Estado del pedido
          <select value={p.estado} onChange={(e) => guardar({ estado: e.target.value })}>
            {ESTADOS_PEDIDO.map((e) => <option key={e}>{e}</option>)}
          </select>
        </label>
        <label className="f">Pago
          <select value={p.pago} onChange={(e) => guardar({ pago: e.target.value })}>
            {ESTADOS_PAGO.map((e) => <option key={e}>{e}</option>)}
          </select>
        </label>
        <label className="f">Medio de pago
          <input list="medios" defaultValue={p.medioPago} onBlur={(e) => e.target.value !== p.medioPago && guardar({ medioPago: e.target.value })} />
        </label>
        <label className="f">Nota interna
          <input defaultValue={p.nota} maxLength={500} onBlur={(e) => e.target.value !== p.nota && guardar({ nota: e.target.value })} />
        </label>
      </div>
      {p.pagadoEn && <div className="fine">Pagado el {fechaHora(p.pagadoEn)}</div>}
    </article>
  );
}

export function Pedidos({ datos, recargar, avisar }: VistaProps) {
  const [estado, setEstado] = useState("");
  const [q, setQ] = useState("");
  const lista = datos.pedidos.filter(
    (p) => (!estado || p.estado === estado) && (!q || `${p.id} ${p.cliente.nombre} ${p.cliente.mail} ${p.cliente.tel}`.toLowerCase().includes(q.toLowerCase())),
  );
  return (
    <section>
      <div className="adm-bar">
        <h2>Pedidos <span className="fine">({lista.length})</span></h2>
        <a className="btn" href="/api/admin/export">Descargar CSV</a>
      </div>
      <div className="adm-filters">
        <input type="search" placeholder="Buscar por n° de pedido, cliente o correo" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={estado} onChange={(e) => setEstado(e.target.value)} aria-label="Filtrar por estado">
          <option value="">Todos los estados</option>
          {ESTADOS_PEDIDO.map((e) => <option key={e}>{e}</option>)}
        </select>
      </div>
      <datalist id="medios">{MEDIOS.map((m) => <option key={m} value={m} />)}</datalist>
      {lista.length ? lista.map((p) => <Tarjeta key={p.id} p={p} recargar={recargar} avisar={avisar} />) : <div className="empty">No hay pedidos con ese filtro.</div>}
    </section>
  );
}
