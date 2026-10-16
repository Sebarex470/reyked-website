"use client";

import { resumenMensual, esVenta, type MesResumen } from "@/lib/finanzas";
import { clp, nombreMes } from "./api";
import type { VistaProps } from "./AdminApp";

export function Barras({ filas, campo }: { filas: MesResumen[]; campo: Exclude<keyof MesResumen, "mes"> }) {
  const max = Math.max(1, ...filas.map((f) => Math.abs(f[campo])));
  return (
    <>
      <div className="adm-bars">
        {filas.map((f) => (
          <div key={f.mes} title={`${nombreMes(f.mes)}: ${clp(f[campo])}`}>
            <i style={{ height: `${(Math.abs(f[campo]) / max) * 100}%` }} className={f[campo] < 0 ? "neg" : ""} />
          </div>
        ))}
      </div>
      <div className="adm-bars-l">
        {filas.map((f) => <span key={f.mes}>{nombreMes(f.mes)}<br />{clp(f[campo])}</span>)}
      </div>
    </>
  );
}

export function Resumen({ datos }: VistaProps) {
  const meses = resumenMensual(datos.pedidos, datos.gastos, 6, new Date(), datos.costos);
  const m = meses[meses.length - 1];
  const porConfirmar = datos.pedidos.filter((p) => p.estado === "Pendiente").length;
  const porDespachar = datos.pedidos.filter((p) => p.estado === "Confirmado" || p.estado === "Preparando").length;
  const sinPago = datos.pedidos.filter((p) => p.pago === "Pendiente" && p.estado !== "Cancelado").length;
  const porEmitir = datos.pedidos.filter((p) => esVenta(p) && p.documento.tipo !== "ninguno" && p.documento.estado === "Por emitir").length;
  const kpi = (t: string, v: string | number) => <div className="adm-kpi"><small>{t}</small><strong>{v}</strong></div>;
  return (
    <section>
      <h2>Este mes</h2>
      <div className="adm-kpis">
        {kpi("Ventas netas", clp(m.ventas))}
        {kpi("Pedidos pagados", m.pedidos)}
        {kpi("Gastos (neto)", clp(m.gastos))}
        {kpi("Utilidad", clp(m.utilidad))}
      </div>
      <h3>Pendientes</h3>
      <div className="adm-kpis">
        {kpi("Pedidos por confirmar", porConfirmar)}
        {kpi("Por despachar o retirar", porDespachar)}
        {kpi("Pagos por cobrar", sinPago)}
        {kpi("Documentos por emitir", porEmitir)}
      </div>
      <h3>Ventas netas, últimos 6 meses</h3>
      <Barras filas={meses} campo="ventas" />
    </section>
  );
}
