import { NextResponse } from "next/server";
import { admin } from "@/lib/server/auth";
import { getStore } from "@/lib/server/store";

export const PUT = admin(async (req) => {
  const b = (await req.json().catch(() => ({}))) as { presupuesto?: unknown };
  const n = Number(b.presupuesto);
  if (!Number.isInteger(n) || n < 0 || n > 10_000_000_000) return NextResponse.json({ error: "Presupuesto inválido." }, { status: 400 });
  await getStore().put("ajustes", "general", { presupuesto: n });
  return NextResponse.json({ presupuesto: n });
});
