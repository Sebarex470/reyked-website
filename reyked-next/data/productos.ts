/* Catálogo del prototipo. Precios de EJEMPLO (neto, CLP). Reemplazar por el listado real de Reyked. */

export type CategoriaKey = "aseo" | "construccion" | "contenedores" | "carga" | "industrial" | "vial";

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
  n: string;
  c: CategoriaKey;
  /** Subtipo (se muestra bajo el nombre) */
  s: string;
  /** Precio neto en CLP */
  p: number;
  g: GlyphKey;
  /** Popularidad (orden por defecto) */
  pop: number;
}

export const IVA = 0.19;
export const WA = "56956474595";

export const CATS: Categoria[] = [
  { k: "aseo", n: "Aseo", g: "bottle" },
  { k: "construccion", n: "Construcción", g: "tape" },
  { k: "contenedores", n: "Contenedores", g: "bin" },
  { k: "carga", n: "Carga y levante", g: "stacker" },
  { k: "industrial", n: "Seguridad industrial", g: "mirror" },
  { k: "vial", n: "Seguridad vial", g: "cone" },
];

/* Nombres tomados de la tienda actual; precios de ejemplo (neto CLP). */
export const P: Producto[] = [
  { id: "alcohol-gel", n: "Alcohol gel", c: "aseo", s: "Higiene", p: 3900, g: "bottle", pop: 95 },
  { id: "alcohol-higienizante", n: "Alcohol higienizante", c: "aseo", s: "Higiene", p: 3500, g: "bottle", pop: 80 },
  { id: "balde-estrujador", n: "Balde con estrujador", c: "aseo", s: "Limpieza", p: 18900, g: "bucket", pop: 70 },
  { id: "balde-toallitas", n: "Balde toallitas Pullcro", c: "aseo", s: "Limpieza", p: 12500, g: "bucket", pop: 40 },
  { id: "secapiso-plastico", n: "Secapiso mango plástico", c: "aseo", s: "Limpieza", p: 6900, g: "mop", pop: 65 },
  { id: "secapiso-metalico", n: "Secapiso mango metálico", c: "aseo", s: "Limpieza", p: 8900, g: "mop", pop: 60 },
  { id: "toalla-2x250", n: "Toalla 2x250", c: "aseo", s: "Papel y toallas", p: 15900, g: "roll", pop: 85 },
  { id: "silicona-super10", n: "Silicona emulsionada Super +10", c: "aseo", s: "Automotriz", p: 9800, g: "bottle", pop: 30 },
  { id: "shampoo-auto", n: "Shampoo de auto", c: "aseo", s: "Automotriz", p: 7200, g: "bottle", pop: 25 },
  { id: "termometro-k3", n: "Termómetro K3", c: "aseo", s: "Salud", p: 21900, g: "thermo", pop: 20 },
  { id: "termometro-axila", n: "Termómetro axila", c: "aseo", s: "Salud", p: 4500, g: "thermo", pop: 22 },
  { id: "adhesivo-cubre-peldano", n: "Adhesivo cubre peldaño", c: "construccion", s: "Pisos", p: 5400, g: "step", pop: 45 },
  { id: "cinta-seguridad", n: "Cinta de seguridad", c: "construccion", s: "Cintas de seguridad", p: 2900, g: "tape", pop: 75 },
  { id: "piso-goma", n: "Piso de goma", c: "construccion", s: "Pisos de goma", p: 24900, g: "step", pop: 35 },
  { id: "contenedor-basura", n: "Contenedor de basura", c: "contenedores", s: "Contenedores", p: 54900, g: "bin", pop: 50 },
  { id: "apiladora-manual", n: "Apiladora manual", c: "carga", s: "Apiladora manual", p: 489000, g: "stacker", pop: 55 },
  { id: "apiladora-pata-ancha", n: "Apiladora pata ancha", c: "carga", s: "Apiladora pata ancha", p: 559000, g: "stacker", pop: 42 },
  { id: "transpaleta-manual", n: "Transpaleta manual", c: "carga", s: "Transpaleta manual", p: 229000, g: "stacker", pop: 58 },
  { id: "rampa-movil", n: "Rampa móvil hidráulica", c: "carga", s: "Rampa móvil hidráulica", p: 3290000, g: "ramp", pop: 10 },
  { id: "espejo-panoramico", n: "Espejo panorámico", c: "industrial", s: "Espejos panorámicos", p: 32900, g: "mirror", pop: 48 },
  { id: "lomo-toro", n: "Lomo de toro", c: "industrial", s: "Lomos de toro", p: 38900, g: "bump", pop: 52 },
  { id: "senaletica-piso-humedo", n: "Señalética piso húmedo", c: "industrial", s: "Protectores", p: 11900, g: "sign", pop: 88 },
  { id: "cadena", n: "Cadena", c: "vial", s: "Barreras", p: 3900, g: "chain", pop: 33 },
  { id: "baliza", n: "Baliza", c: "vial", s: "Lámparas", p: 14900, g: "light", pop: 44 },
  { id: "barra-conos", n: "Barra para conos", c: "vial", s: "Conos", p: 6900, g: "cone", pop: 38 },
  { id: "base-caucho", n: "Base caucho", c: "vial", s: "Conos", p: 5900, g: "cone", pop: 36 },
  { id: "cono-vial", n: "Cono vial", c: "vial", s: "Conos", p: 8900, g: "cone", pop: 90 },
];

export const productoPorId: Record<string, Producto> = Object.fromEntries(P.map((x) => [x.id, x]));
export const catPorKey = Object.fromEntries(CATS.map((c) => [c.k, c])) as Record<CategoriaKey, Categoria>;
export const catName = (k: CategoriaKey) => catPorKey[k].n;
export const porPopularidad: Producto[] = [...P].sort((a, b) => b.pop - a.pop);
