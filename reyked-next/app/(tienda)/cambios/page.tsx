import type { Metadata } from "next";
import { Crumbs } from "@/components/Crumbs";
import { Human } from "@/components/Human";

export const metadata: Metadata = {
  title: "Cambios y devoluciones",
  description: "Cómo gestionar un cambio, reparación o devolución con Reyked.",
  alternates: { canonical: "/cambios" },
};

export default function Cambios() {
  return (
    <div className="wrap page">
      <Crumbs items={[["Inicio", "/"], ["Cambios y devoluciones", null]]} />
      <h1>Cambios y devoluciones</h1>
      <p className="sub">Si algo no sale como esperabas, te ayudamos.</p>
      <div className="note"><b>Texto referencial.</b> Reyked debe definir plazos y condiciones antes de publicar.</div>
      <ol className="steps3">
        <li className="step3"><b>Escríbenos</b><span>Por WhatsApp o a ventas@reyked.cl, con tu número de pedido y fotos del producto.</span></li>
        <li className="step3"><b>Revisamos tu caso</b><span>Vemos qué pasó y qué solución corresponde.</span></li>
        <li className="step3"><b>Te damos una solución</b><span>Cambio, reparación o devolución, según las condiciones que defina Reyked.</span></li>
      </ol>
      <Human />
    </div>
  );
}
