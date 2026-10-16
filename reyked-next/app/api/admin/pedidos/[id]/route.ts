import { NextResponse } from "next/server";
import { admin } from "@/lib/server/auth";
import { getStore } from "@/lib/server/store";
import { ESTADOS_DOC, ESTADOS_PAGO, ESTADOS_PEDIDO, TIPOS_DOC, type Pedido } from "@/lib/tipos";

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const uno = <T extends string>(lista: readonly T[], v: unknown): T | null => (lista.includes(v as T) ? (v as T) : null);
const hoy = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago" }).format(new Date());

export const PATCH = admin(async (req, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const st = getStore();
  const p = await st.get<Pedido>("pedidos", id);
  if (!p) return NextResponse.json({ error: "Pedido no existe." }, { status: 404 });
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });

  if ("estado" in b) {
    const v = uno(ESTADOS_PEDIDO, b.estado);
    if (!v) return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
    p.estado = v;
  }
  if ("pago" in b) {
    const v = uno(ESTADOS_PAGO, b.pago);
    if (!v) return NextResponse.json({ error: "Estado de pago inválido." }, { status: 400 });
    if (v === "Pagado" && p.pago !== "Pagado") p.pagadoEn = new Date().toISOString();
    if (v === "Pendiente") p.pagadoEn = "";
    p.pago = v;
  }
  if ("medioPago" in b) p.medioPago = str(b.medioPago, 40);
  if ("nota" in b) p.nota = str(b.nota, 500);
  if (b.documento && typeof b.documento === "object") {
    const d = b.documento as Record<string, unknown>;
    if ("tipo" in d) { const v = uno(TIPOS_DOC, d.tipo); if (!v) return NextResponse.json({ error: "Tipo de documento inválido." }, { status: 400 }); p.documento.tipo = v; }
    if ("estado" in d) {
      const v = uno(ESTADOS_DOC, d.estado);
      if (!v) return NextResponse.json({ error: "Estado de documento inválido." }, { status: 400 });
      if (v === "Emitido" && p.documento.estado !== "Emitido" && !p.documento.fecha) p.documento.fecha = hoy();
      p.documento.estado = v;
    }
    if ("numero" in d) p.documento.numero = str(d.numero, 30);
    if ("fecha" in d) {
      const f = str(d.fecha, 10);
      if (f && !/^\d{4}-\d{2}-\d{2}$/.test(f)) return NextResponse.json({ error: "Fecha inválida." }, { status: 400 });
      p.documento.fecha = f;
    }
    if ("url" in d) {
      const u = str(d.url, 500);
      // Solo http(s): evita enlaces javascript: guardados por error o malicia.
      if (u && !/^https?:\/\/[^\s]+$/i.test(u)) return NextResponse.json({ error: "El enlace debe empezar con http:// o https://" }, { status: 400 });
      p.documento.url = u;
    }
  }
  await st.put("pedidos", id, p);
  return NextResponse.json(p);
});
