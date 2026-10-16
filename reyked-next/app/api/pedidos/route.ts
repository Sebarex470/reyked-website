import { NextResponse } from "next/server";
import { armarPedido } from "@/lib/server/pedidos";
import { getStore, StoreNoConfigurado } from "@/lib/server/store";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
  try {
    const pedido = await armarPedido(body);
    if (typeof pedido === "string") return NextResponse.json({ error: pedido }, { status: 400 });
    await getStore().put("pedidos", pedido.id, pedido);
    // El cliente solo recibe lo necesario para su comprobante.
    return NextResponse.json({ id: pedido.id, items: pedido.items.map(({ n, q, p }) => ({ n, q, p })), sub: pedido.sub, iva: pedido.iva, total: pedido.total });
  } catch (e) {
    console.error(e);
    const msg = e instanceof StoreNoConfigurado ? "Pedidos no disponibles por ahora. Escríbenos por WhatsApp." : "No se pudo registrar el pedido.";
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
