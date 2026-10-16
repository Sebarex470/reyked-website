"use client";

import { useState } from "react";
import { costoItem, desglosarGasto, esVenta, resumenMensual } from "@/lib/finanzas";
import { CATEGORIAS_GASTO } from "@/lib/tipos";
import { api, clp, hoyChile, nombreMes } from "./api";
import type { VistaProps } from "./AdminApp";
import { Barras } from "./Resumen";

export function Dinero({ datos, recargar, avisar }: VistaProps) {
  const meses = resumenMensual(datos.pedidos, datos.gastos, 6, new Date(), datos.costos);
  const m = meses[meses.length - 1];
  const [busy, setBusy] = useState(false);
  const pres = datos.ajustes.presupuesto;
  const pct = pres > 0 ? (m.gastoBruto / pres) * 100 : 0;
  const sinCosto = datos.pedidos.some((p) => esVenta(p) && p.items.some((i) => costoItem(i, datos.costos) === 0));

  async function envio(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    try { await fn(); avisar(ok); await recargar(); } catch (e) { avisar(e instanceof Error ? e.message : "Error"); } finally { setBusy(false); }
  }

  return (
    <section>
      <h2>Resultado por mes</h2>
      {sinCosto && <div className="note"><b>Faltan costos.</b> Hay ventas de productos sin costo cargado, así que la utilidad se ve más alta de lo real. Cárgalos en la sección Productos.</div>}
      <div className="adm-scroll">
        <table className="adm-tbl">
          <thead><tr><th>Mes</th><th className="r">Ventas netas</th><th className="r">Costo</th><th className="r">Gastos (neto)</th><th className="r">Utilidad</th><th className="r">IVA ventas</th><th className="r">IVA compras</th><th className="r">IVA estimado</th></tr></thead>
          <tbody>
            {[...meses].reverse().map((r) => (
              <tr key={r.mes}>
                <td>{nombreMes(r.mes)}</td><td className="r">{clp(r.ventas)}</td><td className="r">{clp(r.costo)}</td><td className="r">{clp(r.gastos)}</td>
                <td className="r"><b>{clp(r.utilidad)}</b></td><td className="r">{clp(r.ivaDebito)}</td><td className="r">{clp(r.ivaCredito)}</td><td className="r">{clp(r.ivaDebito - r.ivaCredito)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="fine">Utilidad = ventas netas − costo de lo vendido − gastos netos. El IVA estimado (ventas − compras) es referencial: confírmalo con tu contador.</p>
      <h3>Utilidad por mes</h3>
      <Barras filas={meses} campo="utilidad" />

      <h2 className="adm-sp">Presupuesto del mes</h2>
      <form className="adm-inline" onSubmit={(e) => { e.preventDefault(); const v = Number(new FormData(e.currentTarget).get("presupuesto")); void envio(() => api("ajustes", "PUT", { presupuesto: v }), "Presupuesto guardado"); }}>
        <label className="f">Presupuesto mensual de gastos (CLP)<input name="presupuesto" type="number" min={0} step={1000} defaultValue={pres} key={pres} required /></label>
        <button className="btn primary" disabled={busy}>Guardar</button>
      </form>
      {pres > 0 ? (
        <>
          <div className="adm-meter" role="progressbar" aria-valuenow={Math.min(100, Math.round(pct))} aria-valuemin={0} aria-valuemax={100} aria-label="Uso del presupuesto">
            <i className={pct > 100 ? "over" : ""} style={{ width: `${Math.min(100, pct)}%` }} />
          </div>
          <div className="adm-kpis">
            <div className="adm-kpi"><small>Gastado este mes</small><strong>{clp(m.gastoBruto)}</strong></div>
            <div className="adm-kpi"><small>{pres - m.gastoBruto >= 0 ? "Disponible" : "Excedido"}</small><strong>{clp(Math.abs(pres - m.gastoBruto))}</strong></div>
            <div className="adm-kpi"><small>Uso</small><strong>{Math.round(pct)}%</strong></div>
          </div>
        </>
      ) : (
        <div className="note">Aún no defines un presupuesto mensual. Este mes llevas gastado {clp(m.gastoBruto)}.</div>
      )}

      <h2 className="adm-sp">Gastos</h2>
      <form className="adm-grid-form" onSubmit={(e) => {
        e.preventDefault();
        const f = e.currentTarget, d = new FormData(f);
        void envio(async () => { await api("gastos", "POST", { fecha: d.get("fecha"), categoria: d.get("categoria"), descripcion: d.get("descripcion"), monto: Number(d.get("monto")), conIva: d.get("conIva") === "on" }); f.reset(); }, "Gasto registrado");
      }}>
        <label className="f">Fecha<input name="fecha" type="date" defaultValue={hoyChile()} required /></label>
        <label className="f">Categoría<select name="categoria">{CATEGORIAS_GASTO.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className="f">Descripción<input name="descripcion" maxLength={200} /></label>
        <label className="f">Monto total (CLP)<input name="monto" type="number" min={1} step={1} required /></label>
        <label className="adm-chk"><input name="conIva" type="checkbox" /> Tiene factura con IVA</label>
        <button className="btn primary" disabled={busy}>Registrar gasto</button>
      </form>
      {datos.gastos.length ? (
        <div className="adm-scroll">
          <table className="adm-tbl">
            <thead><tr><th>Fecha</th><th>Categoría</th><th>Descripción</th><th className="r">Monto</th><th className="r">IVA</th><th /></tr></thead>
            <tbody>
              {datos.gastos.map((g) => (
                <tr key={g.id}>
                  <td>{g.fecha}</td><td>{g.categoria}</td><td>{g.descripcion}</td><td className="r">{clp(g.monto)}</td><td className="r">{g.conIva ? clp(desglosarGasto(g).iva) : "—"}</td>
                  <td><button className="rm" onClick={() => { if (confirm("¿Eliminar este gasto?")) void envio(() => api(`gastos/${g.id}`, "DELETE"), "Gasto eliminado"); }}>eliminar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <div className="empty">Aún no hay gastos registrados.</div>}
    </section>
  );
}
