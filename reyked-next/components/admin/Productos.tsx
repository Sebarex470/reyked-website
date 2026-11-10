"use client";

import { useState } from "react";
import { P, catName } from "@/data/productos";
import { api, clp } from "./api";
import type { VistaProps } from "./AdminApp";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function Productos({ datos, recargar, avisar }: VistaProps) {
  const [q, setQ] = useState("");
  const [soloSinCosto, setSoloSinCosto] = useState(false);
  async function guardar(id: string, valor: string) {
    try {
      await api("costos", "PUT", { id, costo: Number(valor) });
      avisar("Costo guardado");
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se pudo guardar");
    }
    await recargar();
  }
  const lista = P.filter((p) => (!q || norm(`${p.n} ${p.code}`).includes(norm(q))) && (!soloSinCosto || !(datos.costos[p.id] > 0)));
  const sinCosto = P.filter((p) => p.p > 0 && !(datos.costos[p.id] > 0)).length;
  return (
    <section>
      <h2>Productos y costos</h2>
      <div className="note">
        Carga el <b>costo neto</b> (sin IVA) de cada producto para calcular tu ganancia. Cada pedido guarda el costo vigente al momento de la compra.
        El catálogo, los precios y el stock salen del Excel: al actualizarlo se reimporta con <code>npm run catalogo</code>. Faltan costos en <b>{sinCosto}</b> productos.
      </div>
      <div className="adm-filters">
        <input type="search" placeholder="Buscar por nombre o código" value={q} onChange={(e) => setQ(e.target.value)} />
        <label className="adm-chk"><input type="checkbox" checked={soloSinCosto} onChange={(e) => setSoloSinCosto(e.target.checked)} /> Solo sin costo</label>
      </div>
      <p className="fine">{lista.length} productos</p>
      <div className="adm-scroll">
        <table className="adm-tbl">
          <thead><tr><th>Código</th><th>Producto</th><th>Categoría</th><th className="r">Stock</th><th className="r">Precio neto</th><th className="r">Costo neto</th><th className="r">Margen</th></tr></thead>
          <tbody>
            {lista.slice(0, 100).map((p) => {
              const costo = datos.costos[p.id] ?? 0;
              const margen = costo > 0 && p.p > 0 ? Math.round(((p.p - costo) / p.p) * 100) : null;
              return (
                <tr key={p.id}>
                  <td className="mono">{p.code}</td><td>{p.n}</td><td>{catName(p.c)}</td><td className="r">{p.stock}</td>
                  <td className="r">{p.p > 0 ? clp(p.p) : "a consultar"}</td>
                  <td className="r"><input type="number" min={0} step={1} defaultValue={costo} key={costo} aria-label={`Costo de ${p.n}`} className="adm-num" onBlur={(e) => Number(e.target.value) !== costo && guardar(p.id, e.target.value)} /></td>
                  <td className="r">{margen === null ? "—" : `${margen}%`}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {lista.length > 100 && <p className="fine">Mostrando 100 de {lista.length}: usa el buscador para encontrar el resto.</p>}
    </section>
  );
}
