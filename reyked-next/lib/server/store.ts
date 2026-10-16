import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";

/** Almacén clave-valor por colección. En Vercel el disco NO es persistente: usar Upstash Redis (Marketplace). */
export interface Store {
  list<T>(coll: string): Promise<T[]>;
  get<T>(coll: string, id: string): Promise<T | null>;
  put<T>(coll: string, id: string, value: T): Promise<void>;
  del(coll: string, id: string): Promise<void>;
}

/* ---- Archivo JSON (desarrollo local o servidor propio) ---- */
function fileStore(dir: string): Store {
  let chain: Promise<unknown> = Promise.resolve();
  const lock = <T>(fn: () => Promise<T>): Promise<T> => {
    const next = chain.then(fn, fn);
    chain = next.catch(() => undefined);
    return next;
  };
  const file = (coll: string) => path.join(dir, `${coll.replace(/[^\w-]/g, "")}.json`);
  const read = async (coll: string): Promise<Record<string, unknown>> => {
    try {
      return JSON.parse(await fs.readFile(file(coll), "utf8"));
    } catch {
      return {};
    }
  };
  const write = async (coll: string, data: Record<string, unknown>) => {
    await fs.mkdir(dir, { recursive: true });
    const f = file(coll);
    await fs.writeFile(f + ".tmp", JSON.stringify(data, null, 2));
    await fs.rename(f + ".tmp", f);
  };
  return {
    list: async <T,>(c: string) => Object.values(await read(c)) as T[],
    get: async <T,>(c: string, id: string) => ((await read(c))[id] as T) ?? null,
    put: (c, id, v) => lock(async () => { const d = await read(c); d[id] = v; await write(c, d); }),
    del: (c, id) => lock(async () => { const d = await read(c); delete d[id]; await write(c, d); }),
  };
}

/* ---- Upstash Redis (REST) — también lo usan Vercel KV / Marketplace ---- */
function redisStore(url: string, token: string): Store {
  const cmd = async (...args: (string | number)[]) => {
    const r = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(args),
      cache: "no-store",
    });
    const j = (await r.json().catch(() => ({}))) as { result?: unknown; error?: string };
    if (!r.ok || j.error) throw new Error(`Redis: ${j.error ?? r.status}`);
    return j.result;
  };
  const key = (c: string) => `reyked:${c}`;
  return {
    async list<T>(c: string) {
      const flat = ((await cmd("HGETALL", key(c))) as string[] | null) ?? [];
      const out: T[] = [];
      for (let i = 1; i < flat.length; i += 2) out.push(JSON.parse(flat[i]) as T);
      return out;
    },
    async get<T>(c: string, id: string) {
      const v = (await cmd("HGET", key(c), id)) as string | null;
      return v ? (JSON.parse(v) as T) : null;
    },
    async put(c, id, v) { await cmd("HSET", key(c), id, JSON.stringify(v)); },
    async del(c, id) { await cmd("HDEL", key(c), id); },
  };
}

export class StoreNoConfigurado extends Error {}

let instance: Store | null = null;
export function getStore(): Store {
  if (instance) return instance;
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (url && token) return (instance = redisStore(url, token));
  if (process.env.VERCEL) {
    throw new StoreNoConfigurado("Falta la base de datos: conecta Upstash Redis en Vercel (variables UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN).");
  }
  return (instance = fileStore(process.env.DATA_DIR ?? path.join(process.cwd(), ".data")));
}
