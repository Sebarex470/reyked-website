import { IVA } from "@/data/productos";
import type { Gasto, Pedido } from "./tipos";

/** Mes (YYYY-MM) de un instante, en hora de Chile. */
const fmtMes = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago", year: "numeric", month: "2-digit" });
export const mesChile = (d: Date | string) => {
  const parts = fmtMes.formatToParts(typeof d === "string" ? new Date(d) : d);
  return `${parts.find((p) => p.type === "year")!.value}-${parts.find((p) => p.type === "month")!.value}`;
};

export const esVenta = (p: Pedido) => p.pago === "Pagado";
export const mesVenta = (p: Pedido) => mesChile(p.pagadoEn || p.fecha);

/** Gasto neto e IVA crédito. */
export function desglosarGasto(g: Gasto) {
  const neto = g.conIva ? Math.round(g.monto / (1 + IVA)) : g.monto;
  return { neto, iva: g.monto - neto };
}

export interface MesResumen {
  mes: string;
  pedidos: number;
  ventas: number;      // neto
  ivaDebito: number;
  costo: number;       // costo de lo vendido
  gastos: number;      // neto
  ivaCredito: number;
  utilidad: number;    // ventas − costo − gastos
  gastoBruto: number;  // para comparar con el presupuesto
}

export function meses(n: number, now = new Date()): string[] {
  const out: string[] = [];
  const base = mesChile(now);
  const [y, m] = base.split("-").map(Number);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(y, m - 1 - i, 15));
    out.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

/** Costo neto unitario de un ítem: el guardado en el pedido o, si no había, el costo actual del producto. */
export const costoItem = (i: Pedido["items"][number], costos: Record<string, number>) => i.costo || costos[i.id] || 0;

export function resumenMensual(pedidos: Pedido[], gastos: Gasto[], n = 6, now = new Date(), costos: Record<string, number> = {}): MesResumen[] {
  const rows = new Map<string, MesResumen>(
    meses(n, now).map((mes) => [mes, { mes, pedidos: 0, ventas: 0, ivaDebito: 0, costo: 0, gastos: 0, ivaCredito: 0, utilidad: 0, gastoBruto: 0 }]),
  );
  for (const p of pedidos) {
    const r = rows.get(mesVenta(p));
    if (!r || !esVenta(p)) continue;
    r.pedidos++;
    r.ventas += p.sub;
    r.ivaDebito += p.iva;
    r.costo += p.items.reduce((s, i) => s + costoItem(i, costos) * i.q, 0);
  }
  for (const g of gastos) {
    const r = rows.get(g.fecha.slice(0, 7));
    if (!r) continue;
    const d = desglosarGasto(g);
    r.gastos += d.neto;
    r.ivaCredito += d.iva;
    r.gastoBruto += g.monto;
  }
  for (const r of rows.values()) r.utilidad = r.ventas - r.costo - r.gastos;
  return [...rows.values()];
}
