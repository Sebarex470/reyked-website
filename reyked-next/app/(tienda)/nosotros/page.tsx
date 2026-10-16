import type { Metadata } from "next";
import { Crumbs } from "@/components/Crumbs";
import { Human } from "@/components/Human";

export const metadata: Metadata = {
  title: "Nosotros",
  description: "Reyked es una empresa de Concepción que vende productos de aseo y seguridad industrial con atención personalizada.",
  alternates: { canonical: "/nosotros" },
};

export default function Nosotros() {
  return (
    <div className="wrap page">
      <Crumbs items={[["Inicio", "/"], ["Nosotros", null]]} />
      <h1>Nosotros</h1>
      <div className="about">
        <div>
          <p>Reyked es una empresa de Concepción dedicada a las necesidades de sus clientes. Vendemos productos de aseo y seguridad industrial con atención personalizada y proactiva.</p>
          <p>Trabajamos con responsabilidad, compromiso y calidad. Queremos ser una de las mejores empresas del rubro, reconocida por su calidad y su compromiso con el medio ambiente.</p>
        </div>
        <div className="vm">
          <div><b>Visión</b><span>Ser una empresa líder en el país en aseo y productos industriales, con una estructura ágil, dinámica y sólida.</span></div>
          <div><b>Misión</b><span>Ofrecer productos de higiene, aseo y seguridad industrial de calidad, con soluciones eficientes que cubran por completo cada necesidad.</span></div>
        </div>
      </div>
      <section className="sec">
        <div className="sec-h"><h2>Así trabajamos</h2></div>
        <ol className="steps3">
          <li className="step3 rv"><b>Cuéntanos qué necesitas</b><span>Dinos si es una bodega, una obra o un local. Te orientamos sin compromiso.</span></li>
          <li className="step3 rv"><b>Elegimos contigo</b><span>Te recomendamos el producto y la cantidad. Si compras por volumen, te cotizamos.</span></li>
          <li className="step3 rv"><b>Retiras o despachamos</b><span>Retiro en Las Heras 2241, local 7, o envío por pagar a todo Chile.</span></li>
        </ol>
      </section>
      <Human />
    </div>
  );
}
