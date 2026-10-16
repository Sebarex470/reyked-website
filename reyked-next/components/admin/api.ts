export class NoAutenticado extends Error {}

/** Llama a la API del panel (misma sesión por cookie + cabecera anti-CSRF). */
export async function api<T = unknown>(path: string, method = "GET", body?: unknown): Promise<T> {
  const r = await fetch("/api/admin/" + path, {
    method,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", "X-Requested-With": "reyked" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (r.status === 401 && path !== "login") throw new NoAutenticado();
  if (!r.ok) throw new Error((data as { error?: string }).error || "Error del servidor.");
  return data as T;
}

export const clp = (n: number) => (n < 0 ? "-" : "") + "$" + Math.abs(Math.round(n)).toLocaleString("es-CL");
export const fechaHora = (iso: string) => (iso ? new Date(iso).toLocaleString("es-CL", { timeZone: "America/Santiago", dateStyle: "short", timeStyle: "short" }) : "—");
export const hoyChile = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago" }).format(new Date());
export const nombreMes = (k: string) => new Date(k + "-15T12:00:00Z").toLocaleDateString("es-CL", { month: "short", year: "2-digit", timeZone: "UTC" });
