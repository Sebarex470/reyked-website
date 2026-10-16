import { NextResponse } from "next/server";
import { productoPorId } from "@/data/productos";
import { admin } from "@/lib/server/auth";
import { getStore } from "@/lib/server/store";

/** Costo neto de compra por producto (se usa para calcular la ganancia). */
export const PUT = admin(async (req) => {
  const b = (await req.json().catch(() => ({}))) as { id?: unknown; costo?: unknown };
  const costo = Number(b.costo);
  if (typeof b.id !== "string" || !productoPorId[b.id]) return NextResponse.json({ error: "Producto no existe." }, { status: 404 });
  if (!Number.isInteger(costo) || costo < 0 || costo > 100_000_000) return NextResponse.json({ error: "Costo inválido." }, { status: 400 });
  await getStore().put("costos", b.id, { id: b.id, costo });
  return NextResponse.json({ id: b.id, costo });
});
