import type { Metadata } from "next";
import { Suspense } from "react";
import { ContactForm } from "@/components/ContactForm";
import { Crumbs } from "@/components/Crumbs";
import { CONTACT_EMAIL, FACEBOOK_URL, INSTAGRAM_HANDLE, INSTAGRAM_URL, STORE_ADDRESS, STORE_HOURS, WHATSAPP_NUMBER, WHATSAPP_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Dirección, horario, WhatsApp y correo de Reyked en Concepción. Cotizaciones por volumen.",
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
          <div><dt>Dirección</dt><dd>{STORE_ADDRESS}</dd></div>
          <div><dt>Horario</dt><dd>{STORE_HOURS}</dd></div>
          <div><dt>WhatsApp</dt><dd><a href={WHATSAPP_URL}>{WHATSAPP_NUMBER}</a></dd></div>
          <div><dt>Teléfono fijo</dt><dd>41 260 4612</dd></div>
          <div><dt>Correo</dt><dd><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></dd></div>
          <div><dt>Redes</dt><dd><a href={INSTAGRAM_URL}>Instagram @{INSTAGRAM_HANDLE}</a> · <a href={FACEBOOK_URL}>Facebook Rey Ked</a></dd></div>
        </dl>
        <Suspense fallback={null}><ContactForm /></Suspense>
      </div>
    </div>
  );
}
