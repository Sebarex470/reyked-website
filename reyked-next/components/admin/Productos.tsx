"use client";

import { P, catName } from "@/data/productos";
import { api, clp } from "./api";
import type { VistaProps } from "./AdminApp";

export function Productos({ datos, recargar, avisar }: VistaProps) {
  async function guardar(id: string, valor: string) {
    try {
      await api("costos", "PUT", { id, costo: Number(valor) });
      avisar("Costo guardado");
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se pudo guardar");
    }
    await recargar();
  }
  return (
    <section>
      <h2>Productos y costos</h2>
      <div className="note">
        Carga el <b>costo neto</b> (sin IVA) de cada producto para calcular tu ganancia. Cada pedido guarda el costo vigente al momento de la compra.
        Los precios de venta y el catálogo se actualizan desde el listado real de Reyked (<code>data/productos.ts</code>).
      </div>
      <div className="adm-scroll">
        <table className="adm-tbl">
          <thead><tr><th>Producto</th><th>Categoría</th><th className="r">Precio neto</th><th className="r">Costo neto</th><th className="r">Margen</th></tr></thead>
          <tbody>
            {P.map((p) => {
              const costo = datos.costos[p.id] ?? 0;
              const margen = costo > 0 ? Math.round(((p.p - costo) / p.p) * 100) : null;
              return (
                <tr key={p.id}>
                  <td>{p.n}</td><td>{catName(p.c)}</td><td className="r">{clp(p.p)}</td>
                  <td className="r"><input type="number" min={0} step={1} defaultValue={costo} key={costo} aria-label={`Costo de ${p.n}`} className="adm-num" onBlur={(e) => Number(e.target.value) !== costo && guardar(p.id, e.target.value)} /></td>
                  <td className="r">{margen === null ? "—" : `${margen}%`}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
