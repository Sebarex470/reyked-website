"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CATS_ACTIVAS, P, catName, comprable, destacados, type CategoriaKey } from "@/data/productos";
import { Crumbs } from "./Crumbs";
import { ProductCard } from "./ProductCard";

type Orden = "pop" | "low" | "high" | "az";
const ORDENES: [Orden, string][] = [
  ["pop", "Destacados"],
  ["low", "Precio: menor a mayor"],
  ["high", "Precio: mayor a menor"],
  ["az", "Nombre A–Z"],
];
const POR_PAGINA = 24;
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function ShopView({ cat }: { cat: CategoriaKey | "all" }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const q = (params.get("q") ?? "").trim();
  const tipo = params.get("tipo") ?? "";
  const rawSort = params.get("sort");
  const sort: Orden = ORDENES.some(([k]) => k === rawSort) ? (rawSort as Orden) : "pop";
  const [visibles, setVisibles] = useState(POR_PAGINA);

  const enCategoria = P.filter((p) => cat === "all" || p.c === cat);
  const tipos = cat === "all" ? [] : [...new Set(enCategoria.map((p) => p.s))].sort((a, b) => a.localeCompare(b, "es"));
  const palabras = norm(q).split(/\s+/).filter(Boolean); // todas las palabras deben aparecer, en cualquier orden
  const base = (sort === "pop" ? destacados : P).filter(
    (p) => (cat === "all" || p.c === cat) && (!tipo || p.s === tipo) && (!palabras.length || palabras.every((w) => norm(`${p.n} ${p.s} ${catName(p.c)} ${p.code}`).includes(w))),
  );
  const precio = (p: (typeof P)[number]) => (p.p === 0 ? Infinity : p.p);
  const list = sort === "low" ? [...base].sort((a, b) => precio(a) - precio(b))
    : sort === "high" ? [...base].sort((a, b) => (b.p || -1) - (a.p || -1))
    : sort === "az" ? [...base].sort((a, b) => a.n.localeCompare(b.n, "es")) : base;

  // Al cambiar el filtro se vuelve a la primera página.
  const clave = `${cat}|${q}|${tipo}|${sort}`;
  useEffect(() => setVisibles(POR_PAGINA), [clave]);

  // Los filtros conservan búsqueda y orden al cambiar de categoría.
  const keep = new URLSearchParams();
  if (q) keep.set("q", q);
  if (sort !== "pop") keep.set("sort", sort);
  const qs = keep.toString() ? `?${keep}` : "";

  const setParam = (k: string, v: string) => {
    const sp = new URLSearchParams(params.toString());
    if (!v || (k === "sort" && v === "pop")) sp.delete(k);
    else sp.set(k, v);
    router.replace(sp.toString() ? `${pathname}?${sp}` : pathname, { scroll: false });
  };

  const disponibles = list.filter(comprable).length;
  const count =
    `${list.length} ${list.length === 1 ? "producto" : "productos"}` +
    (cat !== "all" ? ` en ${catName(cat)}` : "") +
    (tipo ? ` · ${tipo}` : "") +
    (q ? ` para "${q}"` : "") +
    (list.length ? ` (${disponibles} con stock)` : "");

  return (
    <div className="wrap page">
      <Crumbs items={cat === "all" ? [["Inicio", "/"], ["Tienda", null]] : [["Inicio", "/"], ["Tienda", "/tienda"], [catName(cat), null]]} />
      <h1>{cat === "all" ? "Tienda" : catName(cat)}</h1>
      <div className="chips" aria-label="Categorías">
        <Link className={"chip" + (cat === "all" ? " on" : "")} href={`/tienda${qs}`}>Todos</Link>
        {CATS_ACTIVAS.map((c) => (
          <Link key={c.k} className={"chip" + (cat === c.k ? " on" : "")} href={`/tienda/${c.k}${qs}`}>{c.n}</Link>
        ))}
      </div>
      {tipos.length > 1 && (
        <div className="chips sub" aria-label="Tipo de producto">
          <button className={"chip" + (!tipo ? " on" : "")} onClick={() => setParam("tipo", "")}>Todos los tipos</button>
          {tipos.map((t) => (
            <button key={t} className={"chip" + (tipo === t ? " on" : "")} onClick={() => setParam("tipo", t)}>{t}</button>
          ))}
        </div>
      )}
      <div className="note">Precios netos en CLP; el IVA (19 %) se suma al total. El stock se confirma al recibir tu pedido.</div>
      <div className="toolbar">
        <div className="count-line" id="shopCount">{count}</div>
        <label className="sort">
          Ordenar{" "}
          <select id="sort" value={sort} onChange={(e) => setParam("sort", e.target.value)}>
            {ORDENES.map(([k, n]) => (
              <option key={k} value={k}>{n}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid" id="shopGrid">
        {list.length ? (
          list.slice(0, visibles).map((p) => <ProductCard key={p.id} p={p} />)
        ) : (
          <div className="empty" style={{ gridColumn: "1/-1" }}>
            <b>No encontramos productos con ese filtro.</b>
            <br />
            Prueba con otra palabra o cambia de categoría. También puedes escribirnos y lo conseguimos.
          </div>
        )}
      </div>
      {visibles < list.length && (
        <div className="more">
          <button className="btn" onClick={() => setVisibles(visibles + POR_PAGINA)}>
            Mostrar más ({list.length - visibles} restantes)
          </button>
        </div>
      )}
    </div>
  );
}
