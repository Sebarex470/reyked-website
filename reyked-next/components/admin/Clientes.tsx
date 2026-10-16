"use client";

import { esVenta } from "@/lib/finanzas";
import { clp, fechaHora } from "./api";
import type { VistaProps } from "./AdminApp";

export function Clientes({ datos }: VistaProps) {
  const mapa = new Map<string, { nombre: string; tel: string; mail: string; rut: string; pedidos: number; comprado: number; ultima: string }>();
  for (const p of datos.pedidos) {
    const k = p.cliente.mail.toLowerCase();
    const c = mapa.get(k) ?? { ...p.cliente, pedidos: 0, comprado: 0, ultima: "" };
    c.pedidos++;
    if (esVenta(p)) c.comprado += p.total;
    if (p.fecha > c.ultima) { c.ultima = p.fecha; c.nombre = p.cliente.nombre; c.tel = p.cliente.tel; if (p.cliente.rut) c.rut = p.cliente.rut; }
    mapa.set(k, c);
  }
  const lista = [...mapa.values()].sort((a, b) => b.comprado - a.comprado || b.ultima.localeCompare(a.ultima));
  return (
    <section>
      <h2>Clientes <span className="fine">({lista.length})</span></h2>
      {lista.length ? (
        <div className="adm-scroll">
          <table className="adm-tbl">
            <thead><tr><th>Cliente</th><th>Contacto</th><th>RUT / razón social</th><th className="r">Pedidos</th><th className="r">Comprado (con IVA)</th><th>Última compra</th></tr></thead>
            <tbody>
              {lista.map((c) => (
                <tr key={c.mail}>
                  <td><b>{c.nombre}</b></td>
                  <td><a href={`mailto:${c.mail}`}>{c.mail}</a><br />{c.tel}</td>
                  <td>{c.rut || "—"}</td><td className="r">{c.pedidos}</td><td className="r">{clp(c.comprado)}</td><td>{fechaHora(c.ultima)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <div className="empty">Aún no hay clientes.</div>}
    </section>
  );
}
