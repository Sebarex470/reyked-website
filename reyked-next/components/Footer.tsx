import Link from "next/link";
import { CATS_ACTIVAS } from "@/data/productos";
import { CONTACT_EMAIL, FACEBOOK_URL, INSTAGRAM_HANDLE, INSTAGRAM_URL, STORE_ADDRESS, STORE_HOURS, STORE_NAME, STORE_TAGLINE, WHATSAPP_NUMBER, WHATSAPP_URL } from "@/lib/site";

export function Footer() {
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="fg">
          <div>
            <Link className="logo" href="/" style={{ fontSize: 34 }}>REY<b>KED</b><small>{STORE_TAGLINE}</small></Link>
            <p style={{ marginTop: 10 }}>Productos de aseo y seguridad industrial en Concepción, con envíos a todo Chile.</p>
          </div>
          <div>
            <h4>Tienda</h4>
            <div id="footShop">
              <Link href="/tienda">Toda la tienda</Link>
              {CATS_ACTIVAS.map((c) => (
                <Link key={c.k} href={`/tienda/${c.k}`}>{c.n}</Link>
              ))}
            </div>
          </div>
          <div>
            <h4>Info</h4>
            <Link href="/nosotros">Nosotros</Link>
            <Link href="/envios">Envíos y retiro</Link>
            <Link href="/cambios">Cambios y devoluciones</Link>
            <Link href="/contacto">Contacto</Link>
          </div>
          <div>
            <h4>Contacto</h4>
            <p>{STORE_ADDRESS}</p>
            <p>{STORE_HOURS}</p>
            <a href={WHATSAPP_URL}>WhatsApp {WHATSAPP_NUMBER}</a>
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            <a href={INSTAGRAM_URL}>Instagram @{INSTAGRAM_HANDLE}</a>
            <a href={FACEBOOK_URL}>Facebook Rey Ked</a>
          </div>
        </div>
        <div className="copy">
          <span>© 2026 {STORE_NAME}</span>
          <span>Propuesta de diseño: textos referenciales</span>
        </div>
      </div>
    </footer>
  );
}
