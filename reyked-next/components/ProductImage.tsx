import Image from "next/image";
import { catPorKey, type Producto } from "@/data/productos";
import { Glyph } from "./Glyph";

/** Foto del producto (si existe) o el ícono de su categoría. El contenedor debe tener position:relative. */
export function ProductImage({ p, sizes, priority }: { p: Producto; sizes: string; priority?: boolean }) {
  if (!p.img) return <Glyph g={catPorKey[p.c].g} />;
  return <Image src={p.img} alt={p.n} fill sizes={sizes} priority={priority} />;
}
