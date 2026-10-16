"use client";

import { useState } from "react";
import { ESTADOS_DOC, TIPOS_DOC, type Pedido } from "@/lib/tipos";
import { api, clp } from "./api";
import type { VistaProps } from "./AdminApp";

type Filtro = "por-emitir" | "emitidas" | "todas";

function Fila({ p, recargar, avisar }: { p: Pedido } & Omit<VistaProps, "datos">) {
  const d = p.documento;
  async function guardar(documento: Record<string, unknown>) {
    try { await api(`pedidos/${p.id}`, "PATCH", { documento }); avisar("Guardado"); } catch (e) { avisar(e instanceof Error ? e.message : "No se pudo guardar"); }
    await recargar();
  }
  return (
    <tr>
      <td className="mono">{p.id}</td>
      <td>{p.cliente.nombre}<br /><span className="fine">{p.cliente.rut || "sin RUT"}</span></td>
      <td className="r">{clp(p.sub)}<br /><span className="fine">IVA {clp(p.iva)}</span></td>
      <td className="r"><b>{clp(p.total)}</b></td>
      <td><select value={d.tipo} aria-label="Tipo" onChange={(e) => guardar({ tipo: e.target.value })}>{TIPOS_DOC.map((t) => <option key={t}>{t}</option>)}</select></td>
      <td><select value={d.estado} aria-label="Estado" onChange={(e) => guardar({ estado: e.target.value })}>{ESTADOS_DOC.map((t) => <option key={t}>{t}</option>)}</select></td>
      <td><input defaultValue={d.numero} aria-label="Número" size={8} onBlur={(e) => e.target.value !== d.numero && guardar({ numero: e.target.value })} /></td>
      <td><input type="date" defaultValue={d.fecha} aria-label="Fecha" onBlur={(e) => e.target.value !== d.fecha && guardar({ fecha: e.target.value })} /></td>
      <td>
        <input defaultValue={d.url} placeholder="https://…" aria-label="Enlace al PDF" onBlur={(e) => e.target.value !== d.url && guardar({ url: e.target.value })} />
        {d.url && <a href={d.url} target="_blank" rel="noopener noreferrer"> abrir</a>}
      </td>
    </tr>
  );
}

export function Facturas({ datos, recargar, avisar }: VistaProps) {
  const [filtro, setFiltro] = useState<Filtro>("por-emitir");
  const base = datos.pedidos.filter((p) => p.estado !== "Cancelado");
  const lista = base.filter((p) => filtro === "todas" || (filtro === "por-emitir" ? p.documento.estado === "Por emitir" && p.documento.tipo !== "ninguno" : p.documento.estado === "Emitido"));
  const porEmitir = base.filter((p) => p.documento.estado === "Por emitir" && p.documento.tipo !== "ninguno").length;
  return (
    <section>
      <h2>Facturas y boletas</h2>
      <div className="note">
        Aquí llevas el control de los documentos tributarios de cada pedido. <b>La emisión se hace en tu sistema de facturación electrónica (SII)</b>:
        emite allá y registra aquí el número y el enlace al PDF. La integración automática se define con el proveedor que elija Reyked.
      </div>
      <div className="adm-kpis">
        <div className="adm-kpi"><small>Por emitir</small><strong>{porEmitir}</strong></div>
        <div className="adm-kpi"><small>Emitidos</small><strong>{base.filter((p) => p.documento.estado === "Emitido").length}</strong></div>
      </div>
      <div className="chips">
        {([["por-emitir", "Por emitir"], ["emitidas", "Emitidas"], ["todas", "Todas"]] as [Filtro, string][]).map(([k, n]) => (
          <button key={k} className={"chip" + (filtro === k ? " on" : "")} onClick={() => setFiltro(k)}>{n}</button>
        ))}
        <a className="btn" href="/api/admin/export" style={{ marginLeft: "auto" }}>Descargar CSV para el contador</a>
      </div>
      {lista.length ? (
        <div className="adm-scroll">
          <table className="adm-tbl wide">
            <thead><tr><th>Pedido</th><th>Cliente</th><th className="r">Neto / IVA</th><th className="r">Total</th><th>Tipo</th><th>Estado</th><th>N°</th><th>Fecha</th><th>Enlace PDF</th></tr></thead>
            <tbody>{lista.map((p) => <Fila key={p.id} p={p} recargar={recargar} avisar={avisar} />)}</tbody>
          </table>
        </div>
      ) : <div className="empty">No hay documentos en esta vista.</div>}
    </section>
  );
}
