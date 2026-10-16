"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { WA, productoPorId } from "@/data/productos";

export function ContactForm() {
  const params = useSearchParams();
  const prod = productoPorId[params.get("producto") ?? ""];
  const [out, setOut] = useState<React.ReactNode>("Se abre en WhatsApp con tu mensaje listo para enviar.");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const v = (k: string) => String(f.get(k) ?? "").trim();
    const n = v("name"), l = v("last"), m = v("mail"), g = v("msg");
    if (!n || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m) || !g) {
      return setOut("Completa nombre, un correo válido y tu mensaje.");
    }
    const txt = `Hola Reyked, soy ${n} ${l} (${m}).\n${g}`;
    setOut(<>Consulta lista. <a target="_blank" rel="noopener" href={`https://wa.me/${WA}?text=${encodeURIComponent(txt)}`}>Enviarla por WhatsApp</a></>);
  }

  return (
    <form className="box" onSubmit={onSubmit} noValidate>
      <div className="two">
        <label className="f" htmlFor="cName">Nombre<input id="cName" name="name" autoComplete="given-name" required /></label>
        <label className="f" htmlFor="cLast">Apellidos<input id="cLast" name="last" autoComplete="family-name" /></label>
      </div>
      <label className="f" htmlFor="cMail">Correo electrónico<input id="cMail" name="mail" type="email" autoComplete="email" required /></label>
      <label className="f" htmlFor="cMsg">Mensaje
        <textarea id="cMsg" name="msg" rows={4} placeholder="Cuéntanos qué necesitas y en qué cantidad"
          defaultValue={prod ? `Hola Reyked, quiero cotizar ___ unidades de ${prod.n}. ¿Tienen precio por volumen?` : ""} />
      </label>
      <button className="btn primary" type="submit">Preparar consulta</button>
      <div className="fine" aria-live="polite">{out}</div>
    </form>
  );
}
