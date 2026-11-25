import Link from "next/link";
import { CATS_ACTIVAS } from "@/data/productos";
import { CONTACT_EMAIL, FACEBOOK_URL, INSTAGRAM_HANDLE, INSTAGRAM_URL, STORE_ADDRESS, STORE_HOURS, STORE_NAME, STORE_TAGLINE, WHATSAPP_NUMBER, WHATSAPP_URL } from "@/lib/site";

export function Footer() {
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STORE_ADDRESS)}`;
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-brand">
            <Link className="logo" href="/" aria-label={`${STORE_NAME}, inicio`}>
              REY<b>KED</b>
              <small>{STORE_TAGLINE}</small>
            </Link>
            <p>Productos de aseo y seguridad industrial en Concepción, con envíos a todo Chile.</p>
          </div>
          <nav className="foot-nav" aria-labelledby="foot-shop-title">
            <h2 id="foot-shop-title">Tienda</h2>
            <ul>
              <li><Link href="/tienda">Toda la tienda</Link></li>
              {CATS_ACTIVAS.map((c) => (
                <li key={c.k}><Link href={`/tienda/${c.k}`}>{c.n}</Link></li>
              ))}
            </ul>
          </nav>
          <nav className="foot-nav" aria-labelledby="foot-info-title">
            <h2 id="foot-info-title">Información</h2>
            <ul>
              <li><Link href="/nosotros">Nosotros</Link></li>
              <li><Link href="/envios">Envíos y retiro</Link></li>
              <li><Link href="/cambios">Cambios y devoluciones</Link></li>
              <li><Link href="/contacto">Contacto</Link></li>
            </ul>
          </nav>
          <div className="foot-contact">
            <h2>Contacto y retiro</h2>
            <a className="foot-address" href={mapUrl} aria-label={`Ver ${STORE_ADDRESS} en Google Maps`}>{STORE_ADDRESS}</a>
            <p>{STORE_HOURS}</p>
            <a className="foot-email" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            <a className="foot-whatsapp" href={WHATSAPP_URL}>WhatsApp {WHATSAPP_NUMBER}</a>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© 2026 {STORE_NAME}</span>
          <nav className="foot-socials" aria-label="Redes sociales de Reyked">
            <a href={INSTAGRAM_URL}>Instagram @{INSTAGRAM_HANDLE}</a>
            <a href={FACEBOOK_URL}>Facebook Rey Ked</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
