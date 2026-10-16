import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { admin } from "@/lib/server/auth";
import { getStore } from "@/lib/server/store";
import type { Gasto } from "@/lib/tipos";

export const POST = admin(async (req) => {
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const g: Gasto = {
    id: crypto.randomBytes(4).toString("hex"),
    fecha: typeof b.fecha === "string" ? b.fecha : "",
    categoria: typeof b.categoria === "string" ? b.categoria.trim().slice(0, 40) : "",
    descripcion: typeof b.descripcion === "string" ? b.descripcion.trim().slice(0, 200) : "",
    monto: Number(b.monto),
    conIva: b.conIva === true,
  };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(g.fecha) || !g.categoria || !Number.isInteger(g.monto) || g.monto < 1 || g.monto > 1_000_000_000) {
    return NextResponse.json({ error: "Fecha, categoría y monto (entero) son obligatorios." }, { status: 400 });
  }
  await getStore().put("gastos", g.id, g);
  return NextResponse.json(g);
});
