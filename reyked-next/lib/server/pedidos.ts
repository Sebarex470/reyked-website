import "server-only";
import crypto from "node:crypto";
import { IVA, productoPorId } from "@/data/productos";
import type { Ajustes, Pedido } from "@/lib/tipos";
import { getStore } from "./store";

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function costosGuardados(): Promise<Record<string, number>> {
  const rows = await getStore().list<{ id: string; costo: number }>("costos");
  return Object.fromEntries(rows.map((r) => [r.id, r.costo]));
}

export async function ajustes(): Promise<Ajustes> {
  return (await getStore().get<Ajustes>("ajustes", "general")) ?? { presupuesto: 0 };
}

/** Valida el pedido del checkout y lo arma con precios y totales calculados en el servidor. */
export async function armarPedido(body: unknown): Promise<Pedido | string> {
  const b = (body ?? {}) as Record<string, unknown>;
  if (!Array.isArray(b.items) || !b.items.length || b.items.length > 50) return "Tu carrito está vacío.";
  const costos = await costosGuardados();
  const items: Pedido["items"] = [];
  for (const raw of b.items as { id?: unknown; q?: unknown }[]) {
    const p = typeof raw?.id === "string" ? productoPorId[raw.id] : undefined;
    const q = Number(raw?.q);
    if (!p) return "Uno de los productos ya no está disponible.";
    if (!Number.isInteger(q) || q < 1 || q > 999) return "Cantidad inválida.";
    items.push({ id: p.id, n: p.n, q, p: p.p, costo: costos[p.id] ?? 0 });
  }
  const c = (b.cliente ?? {}) as Record<string, unknown>;
  const cliente = { nombre: str(c.nombre, 100), tel: str(c.tel, 30), mail: str(c.mail, 120), rut: str(c.rut, 60) };
  if (!cliente.nombre) return "Escribe tu nombre.";
  if (!/^[+\d][\d\s()-]{6,}$/.test(cliente.tel)) return "Escribe un teléfono válido.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cliente.mail)) return "Escribe un correo válido.";
  const entrega = b.entrega === "envio" ? "envio" : "retiro";
  const dir = entrega === "envio" ? str(b.dir, 200) : "";
  if (entrega === "envio" && !dir) return "Escribe la dirección de despacho.";

  const sub = items.reduce((s, i) => s + i.p * i.q, 0);
  const iva = Math.round(sub * IVA);
  return {
    id: "RK-" + crypto.randomBytes(5).toString("hex").toUpperCase(),
    fecha: new Date().toISOString(),
    estado: "Pendiente",
    pago: "Pendiente",
    medioPago: "",
    pagadoEn: "",
    items, sub, iva, total: sub + iva, entrega, dir, cliente,
    documento: { tipo: cliente.rut ? "factura" : "boleta", estado: "Por emitir", numero: "", fecha: "", url: "" },
    nota: "",
  };
}
