"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CATS, P, catName, type CategoriaKey } from "@/data/productos";
import { Crumbs } from "./Crumbs";
import { ProductCard } from "./ProductCard";

type Orden = "pop" | "low" | "high" | "az";
const ORDENES: [Orden, string][] = [
  ["pop", "Más populares"],
  ["low", "Precio: menor a mayor"],
  ["high", "Precio: mayor a menor"],
  ["az", "Nombre A–Z"],
];

export function ShopView({ cat }: { cat: CategoriaKey | "all" }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const q = (params.get("q") ?? "").trim();
  const rawSort = params.get("sort");
  const sort: Orden = ORDENES.some(([k]) => k === rawSort) ? (rawSort as Orden) : "pop";

  const list = P.filter(
    (p) => (cat === "all" || p.c === cat) && (!q || `${p.n} ${p.s} ${catName(p.c)}`.toLowerCase().includes(q.toLowerCase())),
  ).sort((a, b) => {
    if (sort === "low") return a.p - b.p;
    if (sort === "high") return b.p - a.p;
    if (sort === "az") return a.n.localeCompare(b.n, "es");
    return b.pop - a.pop;
  });

  // Los filtros conservan búsqueda y orden al cambiar de categoría.
  const keep = new URLSearchParams();
  if (q) keep.set("q", q);
  if (sort !== "pop") keep.set("sort", sort);
  const qs = keep.toString() ? `?${keep}` : "";

  const onSort = (v: string) => {
    const sp = new URLSearchParams(params.toString());
    if (v === "pop") sp.delete("sort");
    else sp.set("sort", v);
    router.replace(sp.toString() ? `${pathname}?${sp}` : pathname, { scroll: false });
  };

  const count =
    `${list.length} ${list.length === 1 ? "producto" : "productos"}` +
    (cat !== "all" ? ` en ${catName(cat)}` : "") +
    (q ? ` para "${q}"` : "");

  return (
    <div className="wrap page">
      <Crumbs items={cat === "all" ? [["Inicio", "/"], ["Tienda", null]] : [["Inicio", "/"], ["Tienda", "/tienda"], [catName(cat), null]]} />
      <h1>{cat === "all" ? "Tienda" : catName(cat)}</h1>
      <div className="chips" aria-label="Categorías">
        <Link className={"chip" + (cat === "all" ? " on" : "")} href={`/tienda${qs}`}>Todos</Link>
        {CATS.map((c) => (
          <Link key={c.k} className={"chip" + (cat === c.k ? " on" : "")} href={`/tienda/${c.k}${qs}`}>{c.n}</Link>
        ))}
      </div>
      <div className="note">
        <b>Vista de diseño.</b> Los precios (neto, más IVA) son de ejemplo para probar el carrito.
      </div>
      <div className="toolbar">
        <div className="count-line" id="shopCount">{count}</div>
        <label className="sort">
          Ordenar{" "}
          <select id="sort" value={sort} onChange={(e) => onSort(e.target.value)}>
            {ORDENES.map(([k, n]) => (
              <option key={k} value={k}>{n}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid" id="shopGrid">
        {list.length ? (
          list.map((p) => <ProductCard key={p.id} p={p} />)
        ) : (
          <div className="empty" style={{ gridColumn: "1/-1" }}>
            <b>No encontramos productos con ese filtro.</b>
            <br />
            Prueba con otra palabra o cambia de categoría. También puedes escribirnos y lo conseguimos.
          </div>
        )}
      </div>
    </div>
  );
}
