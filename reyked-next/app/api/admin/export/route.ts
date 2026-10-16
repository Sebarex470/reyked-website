import { admin } from "@/lib/server/auth";
import { getStore } from "@/lib/server/store";
import type { Pedido } from "@/lib/tipos";

const celda = (v: unknown) => {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // evita fórmulas en Excel
  return '"' + s.replace(/"/g, '""') + '"';
};

/** CSV de pedidos con documento tributario (para el contador). */
export const GET = admin(async () => {
  const pedidos = (await getStore().list<Pedido>("pedidos")).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const rows: unknown[][] = [["Pedido", "Fecha", "Estado", "Pago", "Medio de pago", "Fecha de pago", "Cliente", "Teléfono", "Correo", "RUT / razón social", "Entrega", "Dirección", "Detalle", "Neto", "IVA", "Total", "Documento", "Estado doc.", "N° doc.", "Fecha doc.", "Enlace doc."]];
  for (const p of pedidos) {
    rows.push([p.id, p.fecha, p.estado, p.pago, p.medioPago, p.pagadoEn, p.cliente.nombre, p.cliente.tel, p.cliente.mail, p.cliente.rut, p.entrega, p.dir, p.items.map((i) => `${i.q}x ${i.n}`).join("; "), p.sub, p.iva, p.total, p.documento.tipo, p.documento.estado, p.documento.numero, p.documento.fecha, p.documento.url]);
  }
  return new Response("﻿" + rows.map((r) => r.map(celda).join(",")).join("\r\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="pedidos-reyked.csv"', "Cache-Control": "no-store" },
  });
});
