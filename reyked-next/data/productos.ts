/* Catálogo real de Reyked, generado desde el Excel con `npm run catalogo -- ruta/Catalogo.xlsm`.
   Precios: neto en CLP (el IVA 19 % se suma). Stock: el del Excel (se actualiza reimportando). */
import catalogo from "./catalogo.json";

export type CategoriaKey = "aseo" | "construccion" | "contenedores" | "carga" | "industrial" | "vial" | "otros";

export type GlyphKey =
  | "bottle" | "bucket" | "mop" | "cone" | "tape" | "stacker" | "bin" | "mirror"
  | "bump" | "light" | "chain" | "thermo" | "sign" | "step" | "roll" | "ramp";

export interface Categoria {
  k: CategoriaKey;
  n: string;
  g: GlyphKey;
}

export interface Producto {
  id: string;
  code: string;
  n: string;
  c: CategoriaKey;
  /** Subtipo (se muestra bajo el nombre y filtra dentro de la categoría) */
  s: string;
  /** Precio neto en CLP; 0 = precio a consultar */
  p: number;
  stock: number;
  /** Foto optimizada en /public (opcional) */
  img?: string;
  w?: number;
  h?: number;
}

export const IVA = 0.19;
export const WA = "56956474595";

export const CATS: Categoria[] = [
  { k: "aseo", n: "Aseo", g: "bottle" },
  { k: "construccion", n: "Construcción", g: "tape" },
  { k: "contenedores", n: "Contenedores", g: "bin" },
  { k: "carga", n: "Embalaje y carga", g: "stacker" },
  { k: "industrial", n: "Seguridad industrial", g: "mirror" },
  { k: "vial", n: "Seguridad vial", g: "cone" },
  { k: "otros", n: "Cafetería y oficina", g: "roll" },
];

export const P: Producto[] = (catalogo as Producto[]).slice().sort((a, b) => a.n.localeCompare(b.n, "es"));

export const productoPorId: Record<string, Producto> = Object.fromEntries(P.map((x) => [x.id, x]));
export const catPorKey = Object.fromEntries(CATS.map((c) => [c.k, c])) as Record<CategoriaKey, Categoria>;
export const catName = (k: CategoriaKey) => catPorKey[k].n;

/** Solo las categorías que hoy tienen productos (las vacías no aparecen en menús ni rutas). */
export const CATS_ACTIVAS: Categoria[] = CATS.filter((c) => P.some((p) => p.c === c.k));

/* Estado de compra de un producto */
export const comprable = (p: Producto) => p.p > 0 && p.stock > 0;
export type EstadoProducto = "disponible" | "ultimas" | "agotado" | "cotizar";
export const estadoProducto = (p: Producto): EstadoProducto =>
  p.p === 0 ? "cotizar" : p.stock <= 0 ? "agotado" : p.stock <= 5 ? "ultimas" : "disponible";

/** Orden "Destacados": primero lo que se puede comprar y tiene foto; luego lo disponible; al final agotados y a consultar. */
const rango = (p: Producto) => (comprable(p) ? 0 : p.p > 0 ? 2 : 1) * 2 + (p.img ? 0 : 1);
export const destacados: Producto[] = [...P].sort((a, b) => rango(a) - rango(b) || b.stock - a.stock || a.n.localeCompare(b.n, "es"));
