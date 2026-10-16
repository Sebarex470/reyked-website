import { NextResponse } from "next/server";
import { admin } from "@/lib/server/auth";
import { getStore } from "@/lib/server/store";

export const DELETE = admin(async (_req, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  if (!/^[a-f0-9]{8}$/.test(id)) return NextResponse.json({ error: "Id inválido." }, { status: 400 });
  await getStore().del("gastos", id);
  return NextResponse.json({ ok: true });
});
