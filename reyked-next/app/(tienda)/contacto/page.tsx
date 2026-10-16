import type { Metadata } from "next";
import { Suspense } from "react";
import { ContactForm } from "@/components/ContactForm";
import { Crumbs } from "@/components/Crumbs";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Dirección, horario, WhatsApp y correos de Reyked en Concepción. Cotizaciones por volumen.",
  alternates: { canonical: "/contacto" },
};

export default function Contacto() {
  return (
    <div className="wrap page">
      <Crumbs items={[["Inicio", "/"], ["Contacto", null]]} />
      <h1>Déjanos tu consulta</h1>
      <p className="sub">Respondemos a la brevedad. Para cotizaciones por volumen, cuéntanos qué producto y cuántas unidades.</p>
      <div className="contact">
        <dl className="info">
          <div><dt>Dirección</dt><dd>Calle Las Heras 2241, local 7, Concepción, Biobío</dd></div>
          <div><dt>Horario</dt><dd>Lunes a viernes, 9:00–14:00 y 15:00–19:00</dd></div>
          <div><dt>WhatsApp</dt><dd>+56 9 5647 4595</dd></div>
          <div><dt>Teléfono fijo</dt><dd>41 260 4612</dd></div>
          <div><dt>Correos</dt><dd>ventas@reyked.cl · kayala@reyked.cl</dd></div>
          <div><dt>Redes</dt><dd><a href="https://www.instagram.com/rey.ked/">Instagram @rey.ked</a> · <a href="https://www.facebook.com/profile.php?id=100078818228310">Facebook Rey Ked</a></dd></div>
        </dl>
        <Suspense fallback={null}><ContactForm /></Suspense>
      </div>
    </div>
  );
}
