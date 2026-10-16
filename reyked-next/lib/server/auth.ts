import "server-only";
import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getStore, StoreNoConfigurado } from "./store";

export const COOKIE = "rk_admin";
const DURACION_MS = 8 * 3600_000;
const MAX_INTENTOS = 5;
const BLOQUEO_MS = 15 * 60_000;

const secret = () => {
  const s = process.env.SESSION_SECRET;
  return s && s.length >= 32 ? s : null;
};
const digest = (s: string) => crypto.createHash("sha256").update(s).digest();
const firmar = (exp: string, s: string) => crypto.createHmac("sha256", s).update(exp).digest("base64url");

export const adminConfigurado = () => !!(process.env.ADMIN_PASSWORD && secret());

export function crearToken(): string {
  const exp = String(Date.now() + DURACION_MS);
  return `${exp}.${firmar(exp, secret()!)}`;
}

export function sesionValida(req: NextRequest): boolean {
  const s = secret();
  const raw = req.cookies.get(COOKIE)?.value;
  if (!s || !raw) return false;
  const [exp, sig] = raw.split(".");
  if (!exp || !sig || !(Number(exp) > Date.now())) return false;
  const esperado = firmar(exp, s);
  return sig.length === esperado.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(esperado));
}

export const credencialesOk = (user: unknown, pass: unknown) => {
  const u = crypto.timingSafeEqual(digest(String(user ?? "")), digest(process.env.ADMIN_USER ?? "admin"));
  const p = crypto.timingSafeEqual(digest(String(pass ?? "")), digest(process.env.ADMIN_PASSWORD ?? "\0"));
  return u && p;
};

export const ipDe = (req: NextRequest) => (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim().slice(0, 64);

interface Intentos { n: number; hasta: number }
export async function bloqueado(ip: string): Promise<boolean> {
  const r = await getStore().get<Intentos>("intentos", ip);
  return !!r && r.n >= MAX_INTENTOS && r.hasta > Date.now();
}
export async function registrarFallo(ip: string) {
  const st = getStore();
  const r = await st.get<Intentos>("intentos", ip);
  const vigente = r && r.hasta > Date.now();
  await st.put("intentos", ip, { n: (vigente ? r.n : 0) + 1, hasta: Date.now() + BLOQUEO_MS });
}
export const limpiarFallos = (ip: string) => getStore().del("intentos", ip);

type Handler<C> = (req: NextRequest, ctx: C) => Promise<Response>;

/** Protege un endpoint del panel: sesión válida y, en cambios, cabecera anti-CSRF. */
export function admin<C = unknown>(fn: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    if (!adminConfigurado()) return NextResponse.json({ error: "Administración no configurada." }, { status: 503 });
    if (!sesionValida(req)) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    if (req.method !== "GET" && req.headers.get("x-requested-with") !== "reyked") {
      return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 });
    }
    try {
      return await fn(req, ctx);
    } catch (e) {
      if (e instanceof StoreNoConfigurado) return NextResponse.json({ error: e.message }, { status: 503 });
      console.error(e);
      return NextResponse.json({ error: "Error interno." }, { status: 500 });
    }
  };
}
