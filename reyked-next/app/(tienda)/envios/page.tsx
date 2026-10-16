import type { Metadata } from "next";
import { Crumbs } from "@/components/Crumbs";
import { Human } from "@/components/Human";

export const metadata: Metadata = {
  title: "Envíos y retiro",
  description: "Retiro en tienda en Concepción y envíos por pagar a todo Chile.",
  alternates: { canonical: "/envios" },
};

export default function Envios() {
  return (
    <div className="wrap page">
      <Crumbs items={[["Inicio", "/"], ["Envíos y retiro", null]]} />
      <h1>Envíos y retiro</h1>
      <p className="sub">Elige cómo recibir tu pedido.</p>
      <div className="note"><b>Texto referencial.</b> Reyked debe confirmar plazos y condiciones antes de publicar.</div>
      <div className="cards3">
        <div className="infocard"><h2>Retiro en tienda</h2><p>Calle Las Heras 2241, local 7, Concepción.</p><p>Lunes a viernes, 9:00–14:00 y 15:00–19:00.</p></div>
        <div className="infocard"><h2>Envío a todo Chile</h2><p>Despachamos a todo el país con envío por pagar.</p><p>El courier se coordina contigo al confirmar el pedido.</p></div>
        <div className="infocard"><h2>Medios de pago</h2><p>Transferencia y pago online con tarjeta (por definir con Reyked).</p><p>Si necesitas factura, indícanos tu RUT al comprar.</p></div>
      </div>
      <Human />
    </div>
  );
}
