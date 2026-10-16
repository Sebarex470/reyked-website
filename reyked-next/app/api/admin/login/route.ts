import { NextRequest, NextResponse } from "next/server";
import { adminConfigurado, bloqueado, COOKIE, credencialesOk, crearToken, ipDe, limpiarFallos, registrarFallo } from "@/lib/server/auth";
import { StoreNoConfigurado } from "@/lib/server/store";

export async function POST(req: NextRequest) {
  if (!adminConfigurado()) return NextResponse.json({ error: "Administración no configurada." }, { status: 503 });
  if (req.headers.get("x-requested-with") !== "reyked") return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 });
  const ip = ipDe(req);
  try {
    if (await bloqueado(ip)) return NextResponse.json({ error: "Demasiados intentos. Espera 15 minutos." }, { status: 429 });
    const b = (await req.json().catch(() => ({}))) as { user?: unknown; password?: unknown };
    if (!credencialesOk(b.user, b.password)) {
      await registrarFallo(ip);
      return NextResponse.json({ error: "Usuario o contraseña incorrectos." }, { status: 401 });
    }
    await limpiarFallos(ip);
  } catch (e) {
    if (e instanceof StoreNoConfigurado) return NextResponse.json({ error: e.message }, { status: 503 });
    throw e;
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, crearToken(), { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 8 * 3600 });
  return res;
}
