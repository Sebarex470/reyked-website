import { NextResponse } from "next/server";
import { admin } from "@/lib/server/auth";
import { ajustes, costosGuardados } from "@/lib/server/pedidos";
import { getStore } from "@/lib/server/store";
import type { DatosAdmin, Gasto, Pedido } from "@/lib/tipos";

export const GET = admin(async () => {
  const st = getStore();
  const [pedidos, gastos, aj, costos] = await Promise.all([st.list<Pedido>("pedidos"), st.list<Gasto>("gastos"), ajustes(), costosGuardados()]);
  pedidos.sort((a, b) => b.fecha.localeCompare(a.fecha));
  gastos.sort((a, b) => b.fecha.localeCompare(a.fecha));
  const datos: DatosAdmin = { pedidos, gastos, ajustes: aj, costos };
  return NextResponse.json(datos);
});
